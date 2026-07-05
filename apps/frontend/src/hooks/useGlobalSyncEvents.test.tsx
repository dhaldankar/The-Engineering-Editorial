import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGlobalSyncEvents } from './useGlobalSyncEvents';
import * as syncService from '../services/syncService';
import * as repositoriesService from '../services/repositoriesService';
import * as reportsService from '../services/reportsService';
import * as repoListContext from '../contexts/RepositoryListContext';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useGlobalSyncEvents', () => {
  it('computes activeCount from mixed terminal/non-terminal mocked statuses', async () => {
    vi.spyOn(repoListContext, 'useRepositoryList').mockReturnValue({
      isLoading: false,
      repositories: [
        { id: 'repo-1', key: 'r1', displayName: 'Repo 1', status: 'synced', githubOwner: 'o', githubRepo: 'r', jiraProjectKey: 'J', ticketKeyPattern: 'J-*', lastSyncedAt: null },
        { id: 'repo-2', key: 'r2', displayName: 'Repo 2', status: 'syncing', githubOwner: 'o', githubRepo: 'r2', jiraProjectKey: 'J', ticketKeyPattern: 'J-*', lastSyncedAt: null },
      ],
    });

    vi.spyOn(syncService, 'getSyncRuns').mockImplementation((repoId) =>
      Promise.resolve([
        {
          id: `run-${repoId}`,
          repositoryId: repoId,
          status: repoId === 'repo-1' ? 'completed' : 'running',
          startedAt: '2026-01-01T00:00:00Z',
          completedAt: repoId === 'repo-1' ? '2026-01-01T00:05:00Z' : null,
          errorMessage: null,
        },
      ]),
    );
    vi.spyOn(repositoriesService, 'getRepositoryStats').mockResolvedValue({ metrics: [], hasFacts: true });
    vi.spyOn(reportsService, 'listReports').mockResolvedValue([]);

    const { result } = renderHook(() => useGlobalSyncEvents(), { wrapper });

    await waitFor(() => expect(result.current.events.length).toBe(2));
    expect(result.current.activeCount).toBe(1);
  });
});
