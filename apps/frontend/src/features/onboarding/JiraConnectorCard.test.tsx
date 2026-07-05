import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JiraConnectorCard } from './JiraConnectorCard';
import * as connectorService from '../../services/connectorService';

function renderCard() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <JiraConnectorCard scope="product" />
    </QueryClientProvider>,
  );
}

describe('JiraConnectorCard', () => {
  it('renders the onboarding layout when disconnected', async () => {
    vi.spyOn(connectorService, 'testConnector').mockResolvedValue({
      source: 'jira',
      scope: 'product',
      connected: false,
      installationOrAccount: null,
      tokenVersion: null,
      lastRotatedAt: null,
      cloudSite: null,
      spaceKey: null,
    });

    renderCard();

    expect(await screen.findByText('Connect Jira')).toBeInTheDocument();
    expect(screen.getByText('Issues, transitions, assignments')).toBeInTheDocument();
  });

  it('renders the connected layout with metadata when connected', async () => {
    vi.spyOn(connectorService, 'testConnector').mockResolvedValue({
      source: 'jira',
      scope: 'product',
      connected: true,
      installationOrAccount: null,
      tokenVersion: 1,
      lastRotatedAt: null,
      cloudSite: 'acme.atlassian.net',
      spaceKey: 'PROJ',
    });

    renderCard();

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/Cloud: acme.atlassian.net/)).toBeInTheDocument();
    expect(screen.getByText(/Space: PROJ/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Re-auth' })).toBeInTheDocument();
  });

  it('clicking Test calls testConnector again and updates the displayed status', async () => {
    const testConnectorSpy = vi
      .spyOn(connectorService, 'testConnector')
      .mockResolvedValueOnce({
        source: 'jira',
        scope: 'product',
        connected: true,
        installationOrAccount: null,
        tokenVersion: 1,
        lastRotatedAt: null,
        cloudSite: 'acme.atlassian.net',
        spaceKey: 'PROJ',
      })
      .mockResolvedValueOnce({
        source: 'jira',
        scope: 'product',
        connected: false,
        installationOrAccount: null,
        tokenVersion: 1,
        lastRotatedAt: null,
        cloudSite: 'acme.atlassian.net',
        spaceKey: 'PROJ',
      });

    renderCard();

    await screen.findByText('Connected');

    await userEvent.click(screen.getByRole('button', { name: 'Test' }));

    await waitFor(() => expect(testConnectorSpy).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('Connect Jira')).toBeInTheDocument());
  });
});
