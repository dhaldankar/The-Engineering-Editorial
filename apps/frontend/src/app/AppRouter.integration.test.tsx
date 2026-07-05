import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './AppRouter';
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
}));

vi.mock('../features/auth/LoginPage', () => ({
  LoginPage: () => <div>Sign in screen</div>,
}));

import { getCurrentUser } from 'aws-amplify/auth';

function renderApp(initialPath: string) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
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
    await waitFor(() => expect(screen.getByText('Connector')).toBeInTheDocument());
  });

  it('renders the requested route when authenticated and connected', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({} as never);
    vi.spyOn(useConnectorStatusModule, 'useConnectorStatus').mockReturnValue({
      connected: true,
      isLoading: false,
      error: null,
    });
    renderApp('/repositories');
    await waitFor(() => expect(screen.getByText('Repository Landing')).toBeInTheDocument());
  });
});
