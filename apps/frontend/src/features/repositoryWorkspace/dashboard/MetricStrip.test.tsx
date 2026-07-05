import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricStrip } from './MetricStrip';
import * as repositoriesService from '../../../services/repositoriesService';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('MetricStrip', () => {
  it('renders an empty/placeholder state (not an error) when stats indicate no facts yet', async () => {
    vi.spyOn(repositoriesService, 'getRepositoryStats').mockResolvedValue({
      metrics: [],
      hasFacts: false,
    });

    render(<MetricStrip repoId="repo-1" />, { wrapper });

    await waitFor(() => expect(screen.getByText('No metrics yet')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders metric cards when facts are present', async () => {
    vi.spyOn(repositoriesService, 'getRepositoryStats').mockResolvedValue({
      metrics: [{ key: 'cycle_time', label: 'PR Cycle Time', value: 3.2, previousValue: 4.1 }],
      hasFacts: true,
    });

    render(<MetricStrip repoId="repo-1" />, { wrapper });

    await waitFor(() => expect(screen.getByText('PR Cycle Time')).toBeInTheDocument());
    expect(screen.getByText('3.2')).toBeInTheDocument();
  });

  it('renders an error state when the stats query fails', async () => {
    vi.spyOn(repositoriesService, 'getRepositoryStats').mockRejectedValue(new Error('boom'));

    render(<MetricStrip repoId="repo-1" />, { wrapper });

    await waitFor(() =>
      expect(screen.getByText('Unable to load metrics for this repository.')).toBeInTheDocument(),
    );
  });
});
