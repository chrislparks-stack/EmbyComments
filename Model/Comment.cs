using System;

namespace CommunityComments.Model
{
    public class Comment
    {
        public string CommentId { get; set; }
        public string AuthorUuid { get; set; }
        public string MediaKey { get; set; }
        public string MediaTitle { get; set; }
        public string Body { get; set; }
        public int? StarRating { get; set; }
        public string ParentCommentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public int LikeCount { get; set; }
        public int DislikeCount { get; set; }
        public int ReplyCount { get; set; }
    }
}