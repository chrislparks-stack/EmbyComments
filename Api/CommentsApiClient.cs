using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;

namespace CommunityComments.Api
{
    public class CommentsApiClient
    {
        private readonly HttpClient _httpClient;
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        public CommentsApiClient()
        {
            _httpClient = new HttpClient();
        }

        private string ApiEndpoint => Plugin.Instance.Configuration.ApiEndpoint.TrimEnd('/');
        private string ServerGuid => Plugin.Instance.Configuration.ServerId ?? string.Empty;
        private string WanAddress => Plugin.Instance.Configuration.WanAddress ?? string.Empty;
        private string EmbyApiKey => Plugin.Instance.Configuration.EmbyApiKey ?? string.Empty;

        public async Task<string> RequestTokenAsync(string userKey, string displayName, string avatarBlob = null, IList<string> wanAddressCandidates = null)
        {
            var url = $"{ApiEndpoint}/token";
            var candidates = (wanAddressCandidates != null && wanAddressCandidates.Count > 0)
                ? wanAddressCandidates.ToArray()
                : new[] { WanAddress };
            var payload = new
            {
                ServerGuid = ServerGuid,
                WanAddress = candidates[0],
                WanAddressCandidates = candidates,
                ApiKey = EmbyApiKey,
                UserKey = userKey,
                DisplayName = displayName,
                AvatarBlob = avatarBlob ?? string.Empty
            };
            var json = JsonSerializer.Serialize(payload, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"Worker /token returned {(int)response.StatusCode}: {body}");
            return body;
        }

        /// <summary>
        /// Calls /server/activity-feed on the Worker with server credentials.
        /// Returns raw JSON: { events, nextCursor }
        /// </summary>
        public async Task<string> GetActivityFeedAsync(string cursor = null, int limit = 25)
        {
            var url = $"{ApiEndpoint}/server/activity-feed";
            var payload = new
            {
                ServerGuid = ServerGuid,
                WanAddress = WanAddress,
                ApiKey = EmbyApiKey,
                Cursor = cursor ?? string.Empty,
                Limit = limit
            };
            var json = JsonSerializer.Serialize(payload, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"Worker /server/activity-feed returned {(int)response.StatusCode}: {body}");
            return body;
        }

        /// <summary>
        /// Calls POST /server/ban-status with server credentials.
        /// Returns raw JSON: { banned, banReason, appealStatus, appealReason, appealResponse, appealCreatedAt }
        /// </summary>
        public async Task<string> GetServerBanStatusAsync()
        {
            var url = $"{ApiEndpoint}/server/ban-status";
            var payload = new
            {
                ServerGuid = ServerGuid,
                WanAddress = WanAddress,
                ApiKey = EmbyApiKey
            };
            var json = JsonSerializer.Serialize(payload, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"Worker /server/ban-status returned {(int)response.StatusCode}: {body}");
            return body;
        }

        /// <summary>
        /// Calls POST /server-ban-appeal with server credentials and the appeal reason.
        /// Returns raw JSON: { ok } or { error }
        /// </summary>
        public async Task<string> ServerBanAppealAsync(string reason)
        {
            var url = $"{ApiEndpoint}/server-ban-appeal";
            var payload = new
            {
                ServerGuid = ServerGuid,
                WanAddress = WanAddress,
                ApiKey = EmbyApiKey,
                reason = reason
            };
            var json = JsonSerializer.Serialize(payload, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"Worker /server-ban-appeal returned {(int)response.StatusCode}: {body}");
            return body;
        }

        public async Task<string> RegisterNameAsync(string userKey, string displayName, bool checkOnly = false)
        {
            var url = $"{ApiEndpoint}/register";
            var payload = new
            {
                ServerGuid = ServerGuid,
                WanAddress = WanAddress,
                ApiKey = EmbyApiKey,
                UserKey = userKey,
                DisplayName = displayName,
                CheckOnly = checkOnly
            };
            var json = JsonSerializer.Serialize(payload, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"Worker /register returned {(int)response.StatusCode}: {body}");
            return body;
        }
    }
}