import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GitHubConnectorCard } from './GitHubConnectorCard';
import * as connectorService from '../../services/connectorService';

function renderCard() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <GitHubConnectorCard scope="product" />
    </QueryClientProvider>,
  );
}

describe('GitHubConnectorCard', () => {
  it('renders the onboarding layout when disconnected', async () => {
    vi.spyOn(connectorService, 'testConnector').mockResolvedValue({
      source: 'github',
      scope: 'product',
      connected: false,
      installationOrAccount: null,
      tokenVersion: null,
      lastRotatedAt: null,
      cloudSite: null,
      spaceKey: null,
    });

    renderCard();

    expect(await screen.findByText('Install GitHub App')).toBeInTheDocument();
    expect(screen.getByText('PRs, reviews, file diffs')).toBeInTheDocument();
  });

  it('renders the connected layout with metadata when connected', async () => {
    vi.spyOn(connectorService, 'testConnector').mockResolvedValue({
      source: 'github',
      scope: 'product',
      connected: true,
      installationOrAccount: 'acme',
      tokenVersion: 3,
      lastRotatedAt: '12d ago',
      cloudSite: null,
      spaceKey: null,
    });

    renderCard();

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/Installation: acme/)).toBeInTheDocument();
    expect(screen.getByText(/token v3/)).toBeInTheDocument();
    expect(screen.getByText(/Last rotated 12d ago/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
  });

  it('clicking Test calls testConnector again and updates the displayed status', async () => {
    const testConnectorSpy = vi
      .spyOn(connectorService, 'testConnector')
      .mockResolvedValueOnce({
        source: 'github',
        scope: 'product',
        connected: true,
        installationOrAccount: 'acme',
        tokenVersion: 3,
        lastRotatedAt: '12d ago',
        cloudSite: null,
        spaceKey: null,
      })
      .mockResolvedValueOnce({
        source: 'github',
        scope: 'product',
        connected: false,
        installationOrAccount: 'acme',
        tokenVersion: 3,
        lastRotatedAt: '12d ago',
        cloudSite: null,
        spaceKey: null,
      });

    renderCard();

    await screen.findByText('Connected');

    await userEvent.click(screen.getByRole('button', { name: 'Test' }));

    await waitFor(() => expect(testConnectorSpy).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('Install GitHub App')).toBeInTheDocument());
  });
});
