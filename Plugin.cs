using System;
using System.Collections.Generic;
using EmbyComments.Api;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace EmbyComments
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
    {
        public static Plugin Instance { get; private set; }
        public CommentsApiClient ApiClient { get; private set; }

        public Plugin(IApplicationPaths appPaths, IXmlSerializer xmlSerializer)
            : base(appPaths, xmlSerializer)
        {
            Instance = this;
            ApiClient = new CommentsApiClient();
        }

        public override string Name => "Emby Comments";
        public override string Description => "Community comments and ratings for movies and TV shows.";
        public override Guid Id => new Guid("a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d");
        public override string ConfigurationFileName => "EmbyComments.xml";

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "EmbyCommentsConfigPage",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.html",
                    IsMainConfigPage = true
                },
                new PluginPageInfo
                {
                    Name = "embycommentsjs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.js"
                },
                new PluginPageInfo
                {
                Name = "embycommentsplugin.js",
                EmbeddedResourcePath = GetType().Namespace + ".Web.plugin.js"
                }
            };
        }
    }
}