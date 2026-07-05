import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './AppRouter';
import { CurrentProductProvider } from '../contexts/CurrentProductContext';
import { RepositoryListProvider } from '../contexts/RepositoryListContext';
import * as useConnectorStatusModule from '../hooks/useConnectorStatus';

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
  fetchAuthSession: vi.fn().mockResolvedValue({ tokens: undefined }),
}));

vi.mock('../services/productsService', () => ({
  getCurrentProduct: vi.fn().mockResolvedValue({ id: 'p1', name: 'Demo', description: null, jiraCloudSite: null, jiraSpaceKey: null }),
  listProducts: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/repositoriesService', () => ({
  listRepositories: vi.fn().mockResolvedValue([]),
  getRepositoryStats: vi.fn().mockResolvedValue({ metrics: [], hasFacts: false }),
}));

vi.mock('../services/syncService', () => ({
  getSyncRuns: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/reportsService', () => ({
  listReports: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/connectorService', () => ({
  testConnector: vi.fn().mockRejectedValue(new Error('not configured')),
}));

vi.mock('../features/auth/LoginPage', () => ({
  LoginPage: () => <div>Sign in screen</div>,
}));

import { getCurrentUser } from 'aws-amplify/auth';

function renderApp(initialPath: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CurrentProductProvider>
        <RepositoryListProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <AppRouter />
          </MemoryRouter>
        </RepositoryListProvider>
      </CurrentProductProvider>
    </QueryClientProvider>,
  );
}

describe('AppRouter guard chain', () => {
  it('redirects an unauthenticated user to /login', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('no session'));
    renderApp('/repositories');
    await waitFor(() => expect(screen.getByText('Sign in screen')).toBeInTheDocument());
  });

  it('redirects an authenticated, disconnected user to /connector', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({} as never);
    vi.spyOn(useConnectorStatusModule, 'useConnectorStatus').mockReturnValue({
      connected: false,
      isLoading: false,
      error: null,
    });
    renderApp('/repositories');
    // The Connector page's "Data Sources" heading proves the redirect landed.
    await waitFor(() => expect(screen.getByText('Data Sources')).toBeInTheDocument());
  });

  it('renders the requested route when authenticated and connected', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({} as never);
    vi.spyOn(useConnectorStatusModule, 'useConnectorStatus').mockReturnValue({
      connected: true,
      isLoading: false,
      error: null,
    });
    renderApp('/repositories');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Repositories' })).toBeInTheDocument(),
    );
  });
});
