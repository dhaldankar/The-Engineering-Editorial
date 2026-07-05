import { useQuery } from '@tanstack/react-query';
import { listReports } from '../services/reportsService';

export function useReports(repoId: string) {
  const query = useQuery({
    queryKey: ['reports', repoId],
    queryFn: () => listReports(repoId),
    enabled: Boolean(repoId),
  });

  return {
    reports: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
