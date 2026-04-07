using System.Collections.Generic;

namespace EmbyComments.Api
{
    public class ActivityFeedEvent
    {
        public string LogId { get; set; }
        public string Action { get; set; }
        public string ActorUuid { get; set; }
        public string ActorName { get; set; }
        public string TargetId { get; set; }
        public string Outcome { get; set; }
        public string Detail { get; set; }
        public string CreatedAt { get; set; }
        public string AffectedUserName { get; set; }
        public string CommentPreview { get; set; }
    }

    public class ActivityFeedResponse
    {
        public List<ActivityFeedEvent> Events { get; set; }
        public string NextCursor { get; set; }
    }

    public class PostCommentRequest
    {
        public string UserUuid { get; set; }
        public string MediaKey { get; set; }
        public string MediaTitle { get; set; }
        public string Body { get; set; }
        public int? StarRating { get; set; }
        public string ParentCommentId { get; set; }
    }

    public class DeleteCommentRequest
    {
        public string CommentId { get; set; }
        public string UserUuid { get; set; }
    }
}