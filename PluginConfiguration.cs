using System.Collections.Generic;
using System.Linq;
using MediaBrowser.Model.Plugins;

namespace EmbyComments
{
    public class UserDisplayNameEntry
    {
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }

    public class PluginConfiguration : BasePluginConfiguration
    {
        public List<UserDisplayNameEntry> UserDisplayNames { get; set; } = new List<UserDisplayNameEntry>();
        public string ApiEndpoint { get; set; } = "https://emby-comments-worker.embycomments.workers.dev";

        /// <summary>
        /// Auto-generated Emby API key used by the Worker to verify this server.
        /// Created automatically on first admin request.
        /// </summary>
        public string EmbyApiKey { get; set; } = string.Empty;

        /// <summary>
        /// The server's WAN address, fetched from System/Info.
        /// Used by the Worker to callback and verify this is a real Emby server.
        /// </summary>
        public string WanAddress { get; set; } = string.Empty;

        /// <summary>
        /// The Emby server's unique ID, fetched from System/Info.
        /// Sent to the Worker as ServerGuid for callback verification.
        /// </summary>
        public string ServerId { get; set; } = string.Empty;

        /// <summary>
        /// When true, only comments from users on this Emby server are displayed.
        /// </summary>
        public bool ServerLocalCommentsOnly { get; set; }

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

        public string GetAvatarUrl(string userId)
        {
            return UserDisplayNames.FirstOrDefault(e => e.UserId == userId)?.AvatarUrl ?? string.Empty;
        }

        public void SetAvatarUrl(string userId, string avatarUrl)
        {
            var entry = UserDisplayNames.FirstOrDefault(e => e.UserId == userId);
            if (entry != null)
                entry.AvatarUrl = avatarUrl;
            else
                UserDisplayNames.Add(new UserDisplayNameEntry { UserId = userId, DisplayName = string.Empty, AvatarUrl = avatarUrl });
        }
    }
}