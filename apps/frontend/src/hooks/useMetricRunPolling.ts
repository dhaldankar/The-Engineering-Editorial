import { useQuery } from '@tanstack/react-query';
import { getRepositoryStats } from '../services/repositoriesService';
import { createPollingQueryOptions } from './internal/pollingQueryOptions';
import { usePageVisibility } from './usePageVisibility';
import { ACTIVE_JOB_INTERVAL_MS } from '../utils/pollingCadence';
import type { RepositoryStatsDTO } from '../types/repository';

const TERMINAL_STATUSES = ['completed', 'failed'];

// ASSUMPTION: architecture.md Section 7 exposes no dedicated metric_run read
// endpoint; this wraps GET /repositories/{id}/stats as the closest documented
// read path (its optional `metricRun` field), per design.md's explicit
// data-source caveat. Revisit once a real metric_run endpoint is added.
export function useMetricRunPolling(repoId: string) {
  const isVisible = usePageVisibility();

  const query = useQuery({
    queryKey: ['metricRun', repoId],
    queryFn: () => getRepositoryStats(repoId),
    ...createPollingQueryOptions<RepositoryStatsDTO>({
      getStatus: (data) => data.metricRun?.status ?? 'completed',
      terminalStatuses: TERMINAL_STATUSES,
      intervalMs: ACTIVE_JOB_INTERVAL_MS,
      isVisible,
    }),
  });

  return {
    metricRun: query.data?.metricRun,
    status: query.data?.metricRun?.status,
    isLoading: query.isLoading,
    error: query.error,
  };
}
