using System;
using System.Collections.Generic;
using System.IO;
using CommunityComments.Api;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Drawing;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace CommunityComments
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages, IHasThumbImage
    {
        public static Plugin Instance { get; private set; }
        public CommentsApiClient ApiClient { get; private set; }

        public Plugin(IApplicationPaths appPaths, IXmlSerializer xmlSerializer)
            : base(appPaths, xmlSerializer)
        {
            Instance = this;
            ApiClient = new CommentsApiClient();
        }

        public override string Name => "Community Comments";
        public override string Description => "Community comments and ratings for movies and TV shows.";
        public override Guid Id => new Guid("a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d");
        public override string ConfigurationFileName => "CommunityComments.xml";

        public ImageFormat ThumbImageFormat => ImageFormat.Png;

        public Stream GetThumbImage()
        {
            return GetType().Assembly.GetManifestResourceStream("CommunityComments.thumb.png");
        }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "CommunityCommentsConfigPage",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.html",
                    IsMainConfigPage = true
                },
                new PluginPageInfo
                {
                    Name = "communitycommentsjs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.js"
                },
                new PluginPageInfo
                {
                    Name = "communitycommentsplugin.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.plugin.js"
                }
            };
        }
    }
}