import { useQueries } from '@tanstack/react-query';
import { useRepositoryList } from '../contexts/RepositoryListContext';
import { getSyncRuns } from '../services/syncService';
import { getRepositoryStats } from '../services/repositoriesService';
import { listReports } from '../services/reportsService';
import { ACTIVE_JOB_INTERVAL_MS } from '../utils/pollingCadence';

export type SyncEventType = 'sync' | 'aggregation' | 'report';

export interface SyncEvent {
  type: SyncEventType;
  repositoryId: string;
  reportId?: string;
  status: string;
  relativeTime: string | null;
}

const TERMINAL_STATUSES = ['completed', 'failed'];

export function useGlobalSyncEvents() {
  const { repositories } = useRepositoryList();

  const syncQueries = useQueries({
    queries: repositories.map((repo) => ({
      queryKey: ['globalSyncEvents', 'sync', repo.id],
      queryFn: () => getSyncRuns(repo.id),
      refetchInterval: ACTIVE_JOB_INTERVAL_MS,
    })),
  });

  const statsQueries = useQueries({
    queries: repositories.map((repo) => ({
      queryKey: ['globalSyncEvents', 'stats', repo.id],
      queryFn: () => getRepositoryStats(repo.id),
      refetchInterval: ACTIVE_JOB_INTERVAL_MS,
    })),
  });

  const reportQueries = useQueries({
    queries: repositories.map((repo) => ({
      queryKey: ['globalSyncEvents', 'reports', repo.id],
      queryFn: () => listReports(repo.id),
      refetchInterval: ACTIVE_JOB_INTERVAL_MS,
    })),
  });

  const events: SyncEvent[] = [];

  repositories.forEach((repo, index) => {
    const latestRun = syncQueries[index]?.data?.[0];
    if (latestRun) {
      events.push({
        type: 'sync',
        repositoryId: repo.id,
        status: latestRun.status,
        relativeTime: latestRun.completedAt ?? latestRun.startedAt,
      });
    }

    const metricRun = statsQueries[index]?.data?.metricRun;
    if (metricRun) {
      events.push({
        type: 'aggregation',
        repositoryId: repo.id,
        status: metricRun.status,
        relativeTime: metricRun.completedAt ?? metricRun.startedAt,
      });
    }

    const reports = reportQueries[index]?.data ?? [];
    for (const report of reports) {
      events.push({
        type: 'report',
        repositoryId: repo.id,
        reportId: report.id,
        status: report.status,
        relativeTime: report.generatedAt,
      });
    }
  });

  const activeCount = events.filter((event) => !TERMINAL_STATUSES.includes(event.status)).length;

  return { events, activeCount };
}
