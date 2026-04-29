using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;

namespace CommunityComments.Api
{
    [Route("/communitycomments/config", "GET", Summary = "Get plugin configuration for any authenticated user")]
    [Authenticated]
    public class GetConfig : IReturn<object> { }

    [Route("/communitycomments/init", "POST", Summary = "Register user and get session token")]
    [Authenticated]
    public class InitUser : IReturn<object>
    {
        public string UserKey { get; set; }
        public string DisplayName { get; set; }
    }

    [Route("/communitycomments/register-name", "POST", Summary = "Sync display name to Worker")]
    [Authenticated]
    public class RegisterName : IReturn<object>
    {
        public string UserKey { get; set; }
        public string DisplayName { get; set; }
        public bool CheckOnly { get; set; }
    }

    [Route("/communitycomments/activity-feed", "GET", Summary = "Get high-priority moderation activity feed (admin only)")]
    [Authenticated]
    public class GetActivityFeed : IReturn<object>
    {
        public string Cursor { get; set; }
        public int Limit { get; set; }
    }

    [Route("/communitycomments/server-ban-status", "GET", Summary = "Get server ban and appeal status (admin only)")]
    [Authenticated]
    public class GetServerBanStatus : IReturn<object> { }

    [Route("/communitycomments/server-ban-appeal", "POST", Summary = "Submit an appeal for a server ban (admin only)")]
    [Authenticated]
    public class PostServerBanAppeal : IReturn<object>
    {
        public string Reason { get; set; }
    }

    public class CommentsService : IService, IRequiresRequest
    {
        private readonly IAuthorizationContext _authContext;
        private readonly IServerApplicationHost _appHost;
        private static readonly HttpClient _httpClient = new HttpClient();

        public IRequest Request { get; set; }

        public CommentsService(IAuthorizationContext authContext, IServerApplicationHost appHost)
        {
            _authContext = authContext;
            _appHost = appHost;
        }

        /// <summary>
        /// Returns config without exposing EmbyApiKey.
        /// Accessible to all authenticated users.
        /// </summary>
        public object Get(GetConfig request)
        {
            var config = Plugin.Instance.Configuration;
            return new
            {
                ApiEndpoint = config.ApiEndpoint,
                UserDisplayNames = config.UserDisplayNames,
                ServerLocalCommentsOnly = config.ServerLocalCommentsOnly
            };
        }

        /// <summary>
        /// Main init endpoint called by plugin.js at startup.
        /// If no API key exists yet, only an admin can trigger provisioning.
        /// Once provisioned, any authenticated user can get a token.
        /// </summary>
        public async Task<object> Post(InitUser request)
        {
            if (string.IsNullOrEmpty(request.UserKey) || string.IsNullOrEmpty(request.DisplayName))
                return new { error = "UserKey and DisplayName are required" };

            var authInfo = _authContext.GetAuthorizationInfo(Request);
            if (authInfo?.User == null)
                return new { error = "Authentication required" };

            var config = Plugin.Instance.Configuration;

            // If API key or WAN address missing, only admin can provision
            if (string.IsNullOrEmpty(config.EmbyApiKey) || string.IsNullOrEmpty(config.WanAddress))
            {
                if (!authInfo.User.Policy.IsAdministrator)
                {
                    return new { error = "Plugin is not yet configured. An admin must log in first to complete setup.", needsAdmin = true };
                }

                try
                {
                    await ProvisionServerCredentials(authInfo.Token);
                }
                catch (Exception ex)
                {
                    return new { error = "Provisioning failed: " + ex.Message, provisionFailed = true };
                }
            }

            // Refresh the WAN address from Emby every time. Residential public IPs
            // change without warning, and a stale WanAddress makes the worker time
            // out trying to verify the server. /emby/System/Info reports the current
            // value — pulling it here keeps config in sync and is cheap (localhost).
            await RefreshWanAddressAsync(config);

            // ServerId can be fetched without admin via public endpoint
            if (string.IsNullOrEmpty(config.ServerId))
            {
                try
                {
                    var localBaseUrl = $"http://localhost:{_appHost.HttpPort}";
                    var resp = await _httpClient.GetAsync($"{localBaseUrl}/emby/System/Info/Public");
                    resp.EnsureSuccessStatusCode();
                    var json = await resp.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var id = doc.RootElement.TryGetProperty("Id", out var sid) ? sid.GetString() : null;
                    if (!string.IsNullOrEmpty(id))
                    {
                        config.ServerId = id;
                        Plugin.Instance.SaveConfiguration();
                    }
                }
                catch { /* will retry next request */ }
            }

            if (string.IsNullOrEmpty(config.ServerId))
                return new { error = "Could not determine server ID. Please restart Emby and try again." };

            // Validate the client-supplied UserKey belongs to this server and to the authenticated caller.
            // Format: "<serverId>:<embyUserId>". Compare userId portions case-insensitively and
            // tolerant of "N" (no-dashes) vs "D" (dashed) GUID formats.
            var keyParts = request.UserKey.Split(':');
            if (keyParts.Length != 2 || string.IsNullOrEmpty(keyParts[0]) || string.IsNullOrEmpty(keyParts[1]))
                return new { error = "Invalid UserKey format" };
            if (!string.Equals(keyParts[0], config.ServerId, StringComparison.OrdinalIgnoreCase))
                return new { error = "UserKey does not belong to this server" };

            string Normalize(string s) => (s ?? string.Empty).Replace("-", "").ToLowerInvariant();
            if (!string.Equals(Normalize(keyParts[1]), Normalize(authInfo.User.Id.ToString("N")), StringComparison.Ordinal))
                return new { error = "UserKey does not match the authenticated user" };

            var embyUserId = keyParts[1];

            // Fetch the authenticated user's avatar from Emby. Whitelist content-type,
            // verify magic bytes, and cap size — the blob is rendered in <img src> in
            // every other server's UI, so SVG/HTML disguised as image/* must be rejected.
            var avatarBlob = string.Empty;
            try
            {
                var localBaseUrl = $"http://localhost:{_appHost.HttpPort}";
                var avatarResp = await _httpClient.GetAsync($"{localBaseUrl}/emby/Users/{embyUserId}/Images/Primary?maxheight=64&quality=80");
                if (avatarResp.IsSuccessStatusCode)
                {
                    var bytes = await avatarResp.Content.ReadAsByteArrayAsync();
                    var sniffed = SniffSafeImageType(bytes);
                    if (sniffed != null && bytes.Length <= 64 * 1024)
                    {
                        avatarBlob = $"data:{sniffed};base64,{Convert.ToBase64String(bytes)}";
                    }
                }
            }
            catch { /* no avatar, fallback to colored initial */ }

            // Now proxy to Worker /token
            try
            {
                var json = await Plugin.Instance.ApiClient.RequestTokenAsync(request.UserKey, request.DisplayName, avatarBlob);
                return DeserializeJson(json);
            }
            catch (Exception ex)
            {
                return new { error = "Failed to get token from Worker: " + ex.Message };
            }
        }

        /// <summary>
        /// Proxies to Worker /register with server credentials.
        /// Used by configPage to sync display names.
        /// </summary>
        public async Task<object> Post(RegisterName request)
        {
            if (string.IsNullOrEmpty(request.UserKey) || string.IsNullOrEmpty(request.DisplayName))
                return new { error = "UserKey and DisplayName are required" };

            var authInfo = _authContext.GetAuthorizationInfo(Request);
            if (authInfo?.User == null)
                return new { error = "Authentication required" };

            var config = Plugin.Instance.Configuration;
            if (string.IsNullOrEmpty(config.EmbyApiKey) || string.IsNullOrEmpty(config.WanAddress))
            {
                return new { error = "Plugin is not yet configured. An admin must log in first." };
            }

            // Validate the UserKey is for THIS server, and that the caller may register it.
            // Format: "<serverId>:<embyUserId>"
            var keyParts = request.UserKey.Split(':');
            if (keyParts.Length != 2 || string.IsNullOrEmpty(keyParts[0]) || string.IsNullOrEmpty(keyParts[1]))
                return new { error = "Invalid UserKey format" };

            if (!string.Equals(keyParts[0], config.ServerId, StringComparison.OrdinalIgnoreCase))
                return new { error = "UserKey does not belong to this server" };

            string Normalize(string s) => (s ?? string.Empty).Replace("-", "").ToLowerInvariant();
            var isAdmin = authInfo.User.Policy != null && authInfo.User.Policy.IsAdministrator;
            var isSelf = string.Equals(Normalize(keyParts[1]), Normalize(authInfo.User.Id.ToString("N")), StringComparison.Ordinal);

            if (!isAdmin && !isSelf)
                return new { error = "Only an administrator can register a name for another user" };

            try
            {
                var json = await Plugin.Instance.ApiClient.RegisterNameAsync(request.UserKey, request.DisplayName, request.CheckOnly);
                return DeserializeJson(json);
            }
            catch (Exception ex)
            {
                return new { error = "Failed to register name: " + ex.Message };
            }
        }

        /// <summary>
        /// Creates an Emby API key (or finds existing) and fetches the WAN address.
        /// Only called once, on first admin request.
        /// </summary>
        private async Task ProvisionServerCredentials(string adminToken)
        {
            var config = Plugin.Instance.Configuration;
            var localBaseUrl = $"http://localhost:{_appHost.HttpPort}";

            // Step 1: Get or create API key
            if (string.IsNullOrEmpty(config.EmbyApiKey))
            {
                // First check if an EmbyComments key already exists
                var listKeysUrl = $"{localBaseUrl}/emby/Auth/Keys";
                var listRequest = new HttpRequestMessage(HttpMethod.Get, listKeysUrl);
                listRequest.Headers.Add("X-Emby-Token", adminToken);

                var listResponse = await _httpClient.SendAsync(listRequest);
                listResponse.EnsureSuccessStatusCode();

                var keysJson = await listResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(keysJson);

                // Look for existing EmbyComments key
                if (doc.RootElement.TryGetProperty("Items", out var items))
                {
                    foreach (var item in items.EnumerateArray())
                    {
                        var appName = item.TryGetProperty("AppName", out var an) ? an.GetString() : null;
                        if (string.Equals(appName, "CommunityComments", StringComparison.OrdinalIgnoreCase) || string.Equals(appName, "EmbyComments", StringComparison.OrdinalIgnoreCase))
                        {
                            var key = item.TryGetProperty("AccessToken", out var at) ? at.GetString() : null;
                            if (!string.IsNullOrEmpty(key))
                            {
                                config.EmbyApiKey = key;
                                break;
                            }
                        }
                    }
                }

                // Only create if we didn't find one
                if (string.IsNullOrEmpty(config.EmbyApiKey))
                {
                    var createKeyUrl = $"{localBaseUrl}/emby/Auth/Keys?App=CommunityComments";
                    var createRequest = new HttpRequestMessage(HttpMethod.Post, createKeyUrl);
                    createRequest.Headers.Add("X-Emby-Token", adminToken);

                    var createResponse = await _httpClient.SendAsync(createRequest);
                    createResponse.EnsureSuccessStatusCode();

                    // Re-fetch keys list to find the new one
                    var listRequest2 = new HttpRequestMessage(HttpMethod.Get, listKeysUrl);
                    listRequest2.Headers.Add("X-Emby-Token", adminToken);

                    var listResponse2 = await _httpClient.SendAsync(listRequest2);
                    listResponse2.EnsureSuccessStatusCode();

                    var keysJson2 = await listResponse2.Content.ReadAsStringAsync();
                    using var doc2 = JsonDocument.Parse(keysJson2);

                    if (doc2.RootElement.TryGetProperty("Items", out var items2))
                    {
                        foreach (var item in items2.EnumerateArray())
                        {
                            var appName = item.TryGetProperty("AppName", out var an) ? an.GetString() : null;
                            if (string.Equals(appName, "CommunityComments", StringComparison.OrdinalIgnoreCase) || string.Equals(appName, "EmbyComments", StringComparison.OrdinalIgnoreCase))
                            {
                                var key = item.TryGetProperty("AccessToken", out var at) ? at.GetString() : null;
                                if (!string.IsNullOrEmpty(key))
                                {
                                    config.EmbyApiKey = key;
                                    break;
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(config.EmbyApiKey))
                        throw new InvalidOperationException("Failed to create Emby API key");
                }
            }

            // Step 2: Fetch WAN address and Server ID using admin token (API key doesn't return network info)
            if (string.IsNullOrEmpty(config.WanAddress) || string.IsNullOrEmpty(config.ServerId))
            {
                var infoRequest = new HttpRequestMessage(HttpMethod.Get, $"{localBaseUrl}/emby/System/Info");
                infoRequest.Headers.Add("X-Emby-Token", adminToken);
                var infoResponse = await _httpClient.SendAsync(infoRequest);
                infoResponse.EnsureSuccessStatusCode();

                var infoJson = await infoResponse.Content.ReadAsStringAsync();
                using var infoDoc = JsonDocument.Parse(infoJson);

                var wanAddress = infoDoc.RootElement.TryGetProperty("WanAddress", out var wa) ? wa.GetString() : null;
                if (string.IsNullOrEmpty(wanAddress))
                    throw new InvalidOperationException("Could not determine server WAN address. Ensure your Emby server has remote access configured.");

                config.WanAddress = wanAddress;

                var serverId = infoDoc.RootElement.TryGetProperty("Id", out var sid) ? sid.GetString() : null;
                if (!string.IsNullOrEmpty(serverId))
                    config.ServerId = serverId;
            }

            // Save config to XML
            Plugin.Instance.SaveConfiguration();
        }

        /// <summary>
        /// Refreshes <see cref="PluginConfiguration.WanAddress"/> from the most
        /// authoritative source we can find. Tries Emby's reported WanAddress first;
        /// if Emby returns an empty value (common behind NAT without UPnP, double-NAT,
        /// or with disabled remote-access discovery), falls back to detecting the
        /// public IP from ipify and reuses the scheme/port from the existing
        /// WanAddress so the user's port-forward setup is preserved.
        ///
        /// Best-effort — every failure path is swallowed because the caller will
        /// surface a more user-visible error if the address still ends up bad.
        /// </summary>
        private async Task RefreshWanAddressAsync(PluginConfiguration config)
        {
            try
            {
                // 1) Ask Emby — fastest and most accurate when it works
                var embyReported = await TryGetEmbyWanAddressAsync(config);
                if (!string.IsNullOrEmpty(embyReported))
                {
                    if (!string.Equals(config.WanAddress, embyReported, StringComparison.Ordinal))
                    {
                        config.WanAddress = embyReported;
                        Plugin.Instance.SaveConfiguration();
                    }
                    return;
                }

                // 2) Fall back to public-IP detection
                var publicIp = await TryGetPublicIpAsync();
                if (string.IsNullOrEmpty(publicIp)) return;

                // Preserve scheme + port from the previous WanAddress when present.
                // The user's port-forward config is encoded there; we don't know it
                // from anywhere else. If no prior value exists, default to
                // http://<ip>:<emby-http-port>.
                string newWan;
                if (!string.IsNullOrEmpty(config.WanAddress)
                    && Uri.TryCreate(config.WanAddress, UriKind.Absolute, out var existingUri))
                {
                    var portPart = existingUri.IsDefaultPort ? string.Empty : ":" + existingUri.Port;
                    newWan = $"{existingUri.Scheme}://{publicIp}{portPart}";
                }
                else
                {
                    newWan = $"http://{publicIp}:{_appHost.HttpPort}";
                }

                if (!string.Equals(config.WanAddress, newWan, StringComparison.Ordinal))
                {
                    config.WanAddress = newWan;
                    Plugin.Instance.SaveConfiguration();
                }
            }
            catch { /* best effort */ }
        }

        private async Task<string> TryGetEmbyWanAddressAsync(PluginConfiguration config)
        {
            if (string.IsNullOrEmpty(config.EmbyApiKey)) return null;
            try
            {
                var localBaseUrl = $"http://localhost:{_appHost.HttpPort}";
                var infoRequest = new HttpRequestMessage(HttpMethod.Get, $"{localBaseUrl}/emby/System/Info");
                infoRequest.Headers.Add("X-Emby-Token", config.EmbyApiKey);
                var infoResponse = await _httpClient.SendAsync(infoRequest);
                if (!infoResponse.IsSuccessStatusCode) return null;

                var infoJson = await infoResponse.Content.ReadAsStringAsync();
                using var infoDoc = JsonDocument.Parse(infoJson);
                var wan = infoDoc.RootElement.TryGetProperty("WanAddress", out var wa) ? wa.GetString() : null;
                return string.IsNullOrEmpty(wan) ? null : wan;
            }
            catch
            {
                return null;
            }
        }

        private static async Task<string> TryGetPublicIpAsync()
        {
            // ipify is a long-running plain-text public-IP echo service. We try it
            // first; a single fallback (icanhazip) covers the rare ipify outage.
            string[] sources = { "https://api.ipify.org", "https://icanhazip.com" };
            foreach (var src in sources)
            {
                try
                {
                    using var resp = await _httpClient.GetAsync(src);
                    if (!resp.IsSuccessStatusCode) continue;
                    var body = (await resp.Content.ReadAsStringAsync()).Trim();
                    // Validate it looks like an IPv4 or IPv6 address before accepting
                    if (System.Net.IPAddress.TryParse(body, out _)) return body;
                }
                catch
                {
                    // Try next source
                }
            }
            return null;
        }

        /// <summary>
        /// Proxies to Worker /server/activity-feed using server credentials. Admin only.
        /// </summary>
        public async Task<object> Get(GetActivityFeed request)
        {
            var authInfo = _authContext.GetAuthorizationInfo(Request);
            if (authInfo?.User == null || !authInfo.User.Policy.IsAdministrator)
                return new { error = "Admin access required" };

            var config = Plugin.Instance.Configuration;
            if (string.IsNullOrEmpty(config.EmbyApiKey) || string.IsNullOrEmpty(config.WanAddress))
                return new { error = "Plugin is not yet configured. An admin must log in first." };

            try
            {
                var json = await Plugin.Instance.ApiClient.GetActivityFeedAsync(request.Cursor, request.Limit > 0 ? request.Limit : 25);
                return JsonSerializer.Deserialize<ActivityFeedResponse>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                return new { error = "Failed to fetch activity feed: " + ex.Message };
            }
        }

        /// <summary>
        /// Fetches this server's ban and appeal status from the Worker. Admin only.
        /// </summary>
        public async Task<object> Get(GetServerBanStatus request)
        {
            var authInfo = _authContext.GetAuthorizationInfo(Request);
            if (authInfo?.User == null || !authInfo.User.Policy.IsAdministrator)
                return new { error = "Admin access required" };

            var config = Plugin.Instance.Configuration;
            if (string.IsNullOrEmpty(config.EmbyApiKey) || string.IsNullOrEmpty(config.WanAddress))
                return new { error = "Plugin is not yet configured. An admin must log in first." };

            try
            {
                var json = await Plugin.Instance.ApiClient.GetServerBanStatusAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                return new
                {
                    banned          = root.TryGetProperty("banned",          out var b)     && b.ValueKind     == JsonValueKind.True,
                    banReason       = root.TryGetProperty("banReason",       out var br)    && br.ValueKind    == JsonValueKind.String ? br.GetString()    : null,
                    appealStatus    = root.TryGetProperty("appealStatus",    out var astat) && astat.ValueKind == JsonValueKind.String ? astat.GetString() : null,
                    appealReason    = root.TryGetProperty("appealReason",    out var ar)    && ar.ValueKind    == JsonValueKind.String ? ar.GetString()    : null,
                    appealResponse  = root.TryGetProperty("appealResponse",  out var aresp) && aresp.ValueKind == JsonValueKind.String ? aresp.GetString() : null,
                    appealCreatedAt = root.TryGetProperty("appealCreatedAt", out var acat)  && acat.ValueKind  == JsonValueKind.String ? acat.GetString()  : null
                };
            }
            catch (Exception ex)
            {
                return new { error = "Failed to fetch server ban status: " + ex.Message };
            }
        }

        /// <summary>
        /// Submits an appeal for this server's ban. Admin only.
        /// </summary>
        public async Task<object> Post(PostServerBanAppeal request)
        {
            var authInfo = _authContext.GetAuthorizationInfo(Request);
            if (authInfo?.User == null || !authInfo.User.Policy.IsAdministrator)
                return new { error = "Admin access required" };

            if (string.IsNullOrEmpty(request.Reason?.Trim()))
                return new { error = "Reason is required" };

            var config = Plugin.Instance.Configuration;
            if (string.IsNullOrEmpty(config.EmbyApiKey) || string.IsNullOrEmpty(config.WanAddress))
                return new { error = "Plugin is not yet configured. An admin must log in first." };

            try
            {
                var json = await Plugin.Instance.ApiClient.ServerBanAppealAsync(request.Reason.Trim());
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.TryGetProperty("ok", out var ok) && ok.ValueKind == JsonValueKind.True)
                    return new { ok = true };
                var errMsg = root.TryGetProperty("error", out var e) && e.ValueKind == JsonValueKind.String ? e.GetString() : "Unknown error";
                return new { error = errMsg };
            }
            catch (Exception ex)
            {
                return new { error = "Failed to submit server ban appeal: " + ex.Message };
            }
        }

        private static object DeserializeJson(string json)
        {
            return JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, object>>(json);
        }

        /// <summary>
        /// Returns a safe image MIME type if <paramref name="bytes"/> matches a known
        /// raster-image magic byte signature, otherwise null. Used to gate avatar blobs
        /// rendered in cross-server &lt;img src&gt; tags — SVG, HTML, and unknown types must
        /// be rejected because they can carry executable content.
        /// </summary>
        private static string SniffSafeImageType(byte[] bytes)
        {
            if (bytes == null || bytes.Length < 12) return null;
            // JPEG: FF D8 FF
            if (bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) return "image/jpeg";
            // PNG: 89 50 4E 47 0D 0A 1A 0A
            if (bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A) return "image/png";
            // GIF: "GIF87a" or "GIF89a"
            if (bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x38
                && (bytes[4] == 0x37 || bytes[4] == 0x39) && bytes[5] == 0x61) return "image/gif";
            // WEBP: "RIFF" .... "WEBP"
            if (bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46
                && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50) return "image/webp";
            return null;
        }
    }
}