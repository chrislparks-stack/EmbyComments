using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Model.Logging;
using MediaBrowser.Model.Tasks;

namespace EmbyComments.Sync
{
    public class SyncTask : IScheduledTask
    {
        private readonly ILogger _logger;

        public string Name => "Sync Community Comments";
        public string Key => "EmbyCommentsSyncTask";
        public string Description => "Pulls latest comments from the community comments service.";
        public string Category => "Emby Comments";

        public SyncTask(ILogManager logManager)
        {
            _logger = logManager.GetLogger("EmbyComments");
        }

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
        {
            yield return new TaskTriggerInfo
            {
                Type = TaskTriggerInfo.TriggerInterval,
                IntervalTicks = TimeSpan.FromHours(1).Ticks
            };
        }

        public async Task Execute(CancellationToken cancellationToken, IProgress<double> progress)
        {
            _logger.Info("EmbyComments: Sync running");
            progress.Report(0);
            await Task.CompletedTask;
            progress.Report(100);
            _logger.Info("EmbyComments: Sync complete");
        }
    }
}