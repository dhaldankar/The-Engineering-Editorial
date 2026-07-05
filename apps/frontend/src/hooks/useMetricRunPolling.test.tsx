import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMetricRunPolling } from './useMetricRunPolling';
import * as repositoriesService from '../services/repositoriesService';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useMetricRunPolling', () => {
  it('stops at a terminal metric_run status', async () => {
    vi.spyOn(repositoriesService, 'getRepositoryStats').mockResolvedValue({
      metrics: [],
      hasFacts: true,
      metricRun: {
        id: 'mr-1',
        status: 'completed',
        metricsWritten: 10,
        startedAt: '2026-01-01T00:00:00Z',
        completedAt: '2026-01-01T00:01:00Z',
      },
    });

    const { result } = renderHook(() => useMetricRunPolling('repo-1'), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('completed'));
  });
});
