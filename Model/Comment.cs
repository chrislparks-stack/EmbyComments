using System;

namespace EmbyComments.Model
{
    public class Comment
    {
        public string CommentId { get; set; }
        public string OriginServerGuid { get; set; }
        public string AuthorDisplayName { get; set; }
        public string MediaKey { get; set; }
        public string MediaTitle { get; set; }
        public string Body { get; set; }
        public int? StarRating { get; set; }
        public string ParentCommentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
}