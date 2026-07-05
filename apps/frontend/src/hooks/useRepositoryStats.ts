import { useQuery } from '@tanstack/react-query';
import { getRepositoryStats } from '../services/repositoriesService';
import { createPollingQueryOptions } from './internal/pollingQueryOptions';
import { usePageVisibility } from './usePageVisibility';
import { AMBIENT_INTERVAL_MS } from '../utils/pollingCadence';
import type { RepositoryStatsDTO } from '../types/repository';

// Repository stats are ambient dashboard data (Requirement 12.4), not an active-job poll
// surface — there is no terminal status to stop on, so this polls indefinitely at
// AMBIENT_INTERVAL_MS while the tab is visible and pauses while hidden.
export function useRepositoryStats(repoId: string) {
  const isVisible = usePageVisibility();

  const query = useQuery({
    queryKey: ['repositoryStats', repoId],
    queryFn: (): Promise<RepositoryStatsDTO> => getRepositoryStats(repoId),
    enabled: Boolean(repoId),
    ...createPollingQueryOptions<RepositoryStatsDTO>({
      getStatus: () => 'ambient',
      terminalStatuses: [],
      intervalMs: AMBIENT_INTERVAL_MS,
      isVisible,
    }),
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
