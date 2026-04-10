using System;

namespace CommunityComments.Model
{
    public class User
    {
        public string UserUuid { get; set; }
        public string UserKey { get; set; }
        public string DisplayName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}