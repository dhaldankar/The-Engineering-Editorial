import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RepositoryHeader } from './RepositoryHeader';
import * as repositoriesService from '../../services/repositoriesService';
import * as syncService from '../../services/syncService';

function renderWithClient(repoId: string) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <RepositoryHeader repoId={repoId} />
    </QueryClientProvider>,
  );
}

describe('RepositoryHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls triggerSync, disables the Sync button while in flight, then re-enables and updates last-synced text once the poll reports a terminal state', async () => {
    const user = userEvent.setup({ delay: null });

    vi.spyOn(repositoriesService, 'getRepository').mockResolvedValue({
      id: 'repo-1',
      key: 'core-api',
      displayName: 'core-api',
      status: 'synced',
      githubOwner: 'acme',
      githubRepo: 'core-api',
      jiraProjectKey: 'CORE',
      ticketKeyPattern: 'CORE-\\d+',
      lastSyncedAt: '2026-01-01T00:00:00Z',
    });

    const getSyncRunsSpy = vi.spyOn(syncService, 'getSyncRuns').mockResolvedValue([]);
    const triggerSyncSpy = vi.spyOn(syncService, 'triggerSync').mockResolvedValue({
      id: 'run-1',
      repositoryId: 'repo-1',
      status: 'running',
      startedAt: '2026-01-02T00:00:00Z',
      completedAt: null,
      errorMessage: null,
    });

    renderWithClient('repo-1');

    const syncButton = await screen.findByRole('button', { name: /sync/i });
    await waitFor(() => expect(syncButton).toBeEnabled());

    // Once the mutation succeeds, the header refetches the latest run and finds it in flight.
    getSyncRunsSpy.mockResolvedValue([
      {
        id: 'run-1',
        repositoryId: 'repo-1',
        status: 'running',
        startedAt: '2026-01-02T00:00:00Z',
        completedAt: null,
        errorMessage: null,
      },
    ]);

    await act(async () => {
      await user.click(syncButton);
    });

    expect(triggerSyncSpy).toHaveBeenCalledWith('repo-1');
    await waitFor(() => expect(syncButton).toBeDisabled());
    expect(screen.getByText('Syncing…')).toBeInTheDocument();

    // The next poll tick reports the run has reached a terminal state.
    getSyncRunsSpy.mockResolvedValue([
      {
        id: 'run-1',
        repositoryId: 'repo-1',
        status: 'completed',
        startedAt: '2026-01-02T00:00:00Z',
        completedAt: '2026-01-02T00:05:00Z',
        errorMessage: null,
      },
    ]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    await waitFor(() => expect(syncButton).toBeEnabled());
    expect(screen.getByText(/last synced/i)).toBeInTheDocument();
    expect(screen.queryByText('Syncing…')).not.toBeInTheDocument();
  });
});
