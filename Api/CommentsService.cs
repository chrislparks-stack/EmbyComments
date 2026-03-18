using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;

namespace EmbyComments.Api
{
    [Route("/embycomments/config", "GET", Summary = "Get plugin configuration for any authenticated user")]
    public class GetConfig : IReturn<object> { }

    [Route("/embycomments/init", "POST", Summary = "Register user and get session token")]
    public class InitUser : IReturn<object>
    {
        public string UserKey { get; set; }
        public string DisplayName { get; set; }
    }

    [Route("/embycomments/register-name", "POST", Summary = "Sync display name to Worker")]
    public class RegisterName : IReturn<object>
    {
        public string UserKey { get; set; }
        public string DisplayName { get; set; }
        public bool CheckOnly { get; set; }
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
                UserDisplayNames = config.UserDisplayNames
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

            var config = Plugin.Instance.Configuration;

            // If not yet provisioned, only admin can set it up
            if (string.IsNullOrEmpty(config.EmbyApiKey) || string.IsNullOrEmpty(config.WanAddress))
            {
                var authInfo = _authContext.GetAuthorizationInfo(Request);
                if (authInfo?.User == null || !authInfo.User.Policy.IsAdministrator)
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

            // Now proxy to Worker /token
            try
            {
                var json = await Plugin.Instance.ApiClient.RequestTokenAsync(request.UserKey, request.DisplayName);
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

            var config = Plugin.Instance.Configuration;
            if (string.IsNullOrEmpty(config.EmbyApiKey) || string.IsNullOrEmpty(config.WanAddress))
            {
                return new { error = "Plugin is not yet configured. An admin must log in first." };
            }

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
                        if (string.Equals(appName, "EmbyComments", StringComparison.OrdinalIgnoreCase))
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
                    var createKeyUrl = $"{localBaseUrl}/emby/Auth/Keys?App=EmbyComments";
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
                            if (string.Equals(appName, "EmbyComments", StringComparison.OrdinalIgnoreCase))
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

            // Step 2: Fetch WAN address using admin token (API key doesn't return network info)
            if (string.IsNullOrEmpty(config.WanAddress))
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
            }

            // Save config to XML
            Plugin.Instance.SaveConfiguration();
        }

        private static object DeserializeJson(string json)
        {
            return JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, object>>(json);
        }
    }
}