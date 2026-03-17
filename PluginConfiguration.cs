using System.Collections.Generic;
using System.Linq;
using MediaBrowser.Model.Plugins;

namespace EmbyComments
{
    public class UserDisplayNameEntry
    {
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
    }

    public class PluginConfiguration : BasePluginConfiguration
    {
        public List<UserDisplayNameEntry> UserDisplayNames { get; set; } = new List<UserDisplayNameEntry>();
        public string ApiEndpoint { get; set; } = "https://emby-comments-worker.embycomments.workers.dev";

        // Helper methods for easy lookup
        public string GetDisplayName(string userId)
        {
            return UserDisplayNames.FirstOrDefault(e => e.UserId == userId)?.DisplayName ?? string.Empty;
        }

        public void SetDisplayName(string userId, string displayName)
        {
            var entry = UserDisplayNames.FirstOrDefault(e => e.UserId == userId);
            if (entry != null)
                entry.DisplayName = displayName;
            else
                UserDisplayNames.Add(new UserDisplayNameEntry { UserId = userId, DisplayName = displayName });
        }
    }
}