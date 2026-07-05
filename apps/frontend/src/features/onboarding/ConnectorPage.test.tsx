import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectorPage } from './ConnectorPage';
import { useConnectorStatus } from '../../hooks/useConnectorStatus';
import * as connectorService from '../../services/connectorService';

// A stand-in for the real Sidebar (built in Phase 3), which per task 3.2 also
// derives its locked/unlocked state from useConnectorStatus('product'). This
// proves ConnectorPage and any consumer sharing the same query key react to
// one cached connector value together (Requirement 3.7), without depending
// on Phase 3's not-yet-built Sidebar component.
function SidebarStub() {
  const { connected } = useConnectorStatus('product');
  return <div>{connected ? 'Settings' : 'Settings locked'}</div>;
}

function renderPageWithSidebar() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <SidebarStub />
      <ConnectorPage />
    </QueryClientProvider>,
  );
}

describe('ConnectorPage', () => {
  it('composes GitHub and Jira cards under the Data Sources heading', async () => {
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

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ConnectorPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Data Sources')).toBeInTheDocument();
    expect(await screen.findByText('Install GitHub App')).toBeInTheDocument();
    expect(await screen.findByText('Connect Jira')).toBeInTheDocument();
  });

  it('unlocks a sibling consumer of useConnectorStatus once the connector transitions to connected, without remounting', async () => {
    let githubConnected = false;

    vi.spyOn(connectorService, 'testConnector').mockImplementation((_scope, source) => {
      if (source === 'github') {
        return Promise.resolve({
          source: 'github',
          scope: 'product',
          connected: githubConnected,
          installationOrAccount: githubConnected ? 'acme' : null,
          tokenVersion: githubConnected ? 3 : null,
          lastRotatedAt: githubConnected ? '1d ago' : null,
          cloudSite: null,
          spaceKey: null,
        });
      }
      return Promise.resolve({
        source: 'jira',
        scope: 'product',
        connected: false,
        installationOrAccount: null,
        tokenVersion: null,
        lastRotatedAt: null,
        cloudSite: null,
        spaceKey: null,
      });
    });

    renderPageWithSidebar();

    expect(await screen.findByText('Settings locked')).toBeInTheDocument();

    // Simulate the connector transitioning to connected: the user completed
    // the GitHub App install in another tab and returned here. The card's
    // window-focus handler invalidates the shared connector query, so every
    // consumer of that cached value updates together (Requirement 3.7).
    githubConnected = true;
    fireEvent(window, new Event('focus'));

    await waitFor(() => expect(screen.getByText('Settings')).toBeInTheDocument());
    expect(screen.queryByText('Settings locked')).not.toBeInTheDocument();
  });
});
