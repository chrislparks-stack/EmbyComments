using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using EmbyComments.Model;

namespace EmbyComments.Api
{
    public class CommentsApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiEndpoint;

        public CommentsApiClient(string apiEndpoint)
        {
            _httpClient = new HttpClient();
            _apiEndpoint = apiEndpoint.TrimEnd('/');
        }

        public async Task<List<Comment>> GetCommentsAsync(string mediaKey)
        {
            var url = $"{_apiEndpoint}/comments?mediaKey={Uri.EscapeDataString(mediaKey)}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Comment>>(json);
        }

        public async Task PostCommentAsync(Comment comment)
        {
            var url = $"{_apiEndpoint}/comments";
            var json = JsonSerializer.Serialize(comment);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
        }
    }
}