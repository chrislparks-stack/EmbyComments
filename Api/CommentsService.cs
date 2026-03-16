using System;
using System.Threading.Tasks;
using EmbyComments.Model;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;

namespace EmbyComments.Api
{
    [Route("/embycomments/comments", "GET", Summary = "Get comments for a media item")]
    public class GetComments : IReturn<Comment[]>
    {
        [ApiMember(Name = "MediaKey", ParameterType = "query", IsRequired = true)]
        public string MediaKey { get; set; }
    }

    [Route("/embycomments/comments", "POST", Summary = "Post a new comment")]
    public class PostComment : PostCommentRequest, IReturnVoid { }

    public class CommentsService : IService
    {
        public async Task<object> Get(GetComments request)
        {
            if (string.IsNullOrEmpty(request.MediaKey))
                throw new ArgumentException("MediaKey is required");

            return await Plugin.Instance.ApiClient.GetCommentsAsync(request.MediaKey);
        }

        public async Task Post(PostComment request)
        {
            var plugin = Plugin.Instance;
            var config = plugin.Configuration;

            if (string.IsNullOrEmpty(config.DisplayName))
                throw new InvalidOperationException("Please set your display name in plugin settings.");

            var comment = new Comment
            {
                CommentId = Guid.NewGuid().ToString(),
                OriginServerGuid = plugin.Id.ToString(),
                AuthorDisplayName = config.DisplayName,
                MediaKey = request.MediaKey,
                MediaTitle = request.MediaTitle ?? string.Empty,
                Body = request.Body,
                StarRating = request.StarRating,
                ParentCommentId = request.ParentCommentId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await plugin.ApiClient.PostCommentAsync(comment);
        }
    }
}