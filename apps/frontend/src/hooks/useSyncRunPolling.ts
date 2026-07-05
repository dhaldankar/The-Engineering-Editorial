import { useQuery } from '@tanstack/react-query';
import { getSyncRun, getSyncRuns } from '../services/syncService';
import { createPollingQueryOptions } from './internal/pollingQueryOptions';
import { usePageVisibility } from './usePageVisibility';
import { ACTIVE_JOB_INTERVAL_MS } from '../utils/pollingCadence';
import type { SyncRunDTO } from '../types/syncRun';

const TERMINAL_STATUSES = ['completed', 'failed'];

export function useSyncRunPolling(repoId: string, runId?: string) {
  const isVisible = usePageVisibility();

  const query = useQuery({
    queryKey: ['syncRun', repoId, runId ?? 'latest'],
    queryFn: async (): Promise<SyncRunDTO | null> => {
      if (runId) {
        return getSyncRun(repoId, runId);
      }
      const runs = await getSyncRuns(repoId);
      return runs[0] ?? null;
    },
    ...createPollingQueryOptions<SyncRunDTO | null>({
      getStatus: (data) => data?.status ?? 'completed',
      terminalStatuses: TERMINAL_STATUSES,
      intervalMs: ACTIVE_JOB_INTERVAL_MS,
      isVisible,
    }),
  });

  return {
    run: query.data ?? undefined,
    status: query.data?.status,
    isLoading: query.isLoading,
    error: query.error,
  };
}
