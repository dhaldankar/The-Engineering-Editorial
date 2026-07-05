import { useQuery } from '@tanstack/react-query';
import { getReportStatus } from '../services/reportsService';
import { createPollingQueryOptions } from './internal/pollingQueryOptions';
import { usePageVisibility } from './usePageVisibility';
import { ACTIVE_JOB_INTERVAL_MS } from '../utils/pollingCadence';
import type { AsyncReportDTO } from '../types/report';

const TERMINAL_STATUSES = ['completed', 'failed'];

export function useReportStatusPolling(repoId: string, reportId: string) {
  const isVisible = usePageVisibility();

  const query = useQuery({
    queryKey: ['reportStatus', repoId, reportId],
    queryFn: () => getReportStatus(repoId, reportId),
    ...createPollingQueryOptions<AsyncReportDTO>({
      getStatus: (data) => data.status,
      terminalStatuses: TERMINAL_STATUSES,
      intervalMs: ACTIVE_JOB_INTERVAL_MS,
      isVisible,
    }),
  });

  return {
    report: query.data,
    status: query.data?.status,
    stage: query.data?.stage ?? null,
    progress: query.data?.progress ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
