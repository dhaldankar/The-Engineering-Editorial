import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSyncRunPolling } from './useSyncRunPolling';
import * as syncService from '../services/syncService';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useSyncRunPolling', () => {
  it('resolves the specific run when runId is given', async () => {
    const spy = vi.spyOn(syncService, 'getSyncRun').mockResolvedValue({
      id: 'run-1',
      repositoryId: 'repo-1',
      status: 'completed',
      startedAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:05:00Z',
      errorMessage: null,
    });

    const { result } = renderHook(() => useSyncRunPolling('repo-1', 'run-1'), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('completed'));
    expect(spy).toHaveBeenCalledWith('repo-1', 'run-1');
  });

  it('stops polling once the run reaches a terminal state', async () => {
    vi.spyOn(syncService, 'getSyncRuns').mockResolvedValue([
      {
        id: 'run-2',
        repositoryId: 'repo-1',
        status: 'failed',
        startedAt: '2026-01-01T00:00:00Z',
        completedAt: '2026-01-01T00:05:00Z',
        errorMessage: 'boom',
      },
    ]);

    const { result } = renderHook(() => useSyncRunPolling('repo-1'), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('failed'));
  });
});
