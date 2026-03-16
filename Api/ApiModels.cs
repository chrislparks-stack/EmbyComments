namespace EmbyComments.Api
{
    public class PostCommentRequest
    {
        public string MediaKey { get; set; }
        public string MediaTitle { get; set; }
        public string Body { get; set; }
        public int? StarRating { get; set; }
        public string ParentCommentId { get; set; }
    }

    public class DeleteCommentRequest
    {
        public string CommentId { get; set; }
    }
}