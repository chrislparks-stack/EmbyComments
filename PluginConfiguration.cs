using MediaBrowser.Model.Plugins;

namespace EmbyComments
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        public string DisplayName { get; set; } = string.Empty;
        public string ApiEndpoint { get; set; } = "https://emby-comments-worker.embycomments.workers.dev";
    }
}