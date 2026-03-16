using System;

namespace EmbyComments.Model
{
    public class Peer
    {
        public string ServerGuid { get; set; }
        public string ServerUrl { get; set; }
        public string DisplayName { get; set; }
        public DateTime LastSyncedAt { get; set; }
    }
}