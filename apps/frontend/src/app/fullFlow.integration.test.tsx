import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './AppRouter';
import { CurrentProductProvider } from '../contexts/CurrentProductContext';
import { RepositoryListProvider } from '../contexts/RepositoryListContext';
import type { RepositoryDTO } from '../types/repository';
import type { AsyncReportDTO } from '../types/report';

// Full happy path (task 12.3): onboarding → connector unlock → add repository
// → dashboard → generate report → poll to completed → report viewer → back.
// Services are mocked at the services/*.ts boundary so real hooks, contexts,
// guards, and features are exercised.

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({}),
  signOut: vi.fn(),
  fetchAuthSession: vi.fn().mockResolvedValue({ tokens: undefined }),
}));

const state = {
  connected: false,
  repositories: [] as RepositoryDTO[],
  reports: [] as AsyncReportDTO[],
};

const repo: RepositoryDTO = {
  id: 'repo-1',
  key: 'checkout',
  displayName: 'Checkout Service',
  status: 'synced',
  githubOwner: 'acme',
  githubRepo: 'checkout',
  jiraProjectKey: 'CHK',
  ticketKeyPattern: 'CHK-*',
  lastSyncedAt: '2026-07-01T00:00:00Z',
};

function makeReport(status: AsyncReportDTO['status']): AsyncReportDTO {
  return {
    id: 'rep-1',
    repositoryId: 'repo-1',
    reportType: 'weekly',
    period: '2026-W27',
    periodStart: '2026-06-29',
    periodEnd: '2026-07-05',
    status,
    stage: status === 'generating' ? 'signals' : null,
    progress: status === 'generating' ? 40 : 100,
    signalCount: status === 'completed' ? 1 : null,
    retryCount: 0,
    errorMessage: null,
    generatedAt: status === 'completed' ? '2026-07-05T12:00:00Z' : null,
  };
}

vi.mock('../services/productsService', () => ({
  getCurrentProduct: vi.fn().mockResolvedValue({
    id: 'p1',
    name: 'Demo Product',
    description: null,
    jiraCloudSite: 'acme.atlassian.net',
    jiraSpaceKey: 'CHK',
  }),
  listProducts: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/connectorService', () => ({
  testConnector: vi.fn().mockImplementation((_scope: string, source: string) =>
    Promise.resolve({
      source,
      scope: 'product',
      connected: state.connected,
      installationOrAccount: state.connected ? 'acme' : null,
      tokenVersion: state.connected ? 1 : null,
      lastRotatedAt: null,
      cloudSite: null,
      spaceKey: null,
    }),
  ),
  getConnector: vi.fn().mockRejectedValue(new Error('none')),
}));

vi.mock('../services/repositoriesService', () => ({
  listRepositories: vi.fn().mockImplementation(() => Promise.resolve(state.repositories)),
  getRepository: vi.fn().mockImplementation(() => Promise.resolve(repo)),
  createRepository: vi.fn().mockImplementation(() => {
    state.repositories = [repo];
    return Promise.resolve(repo);
  }),
  getRepositoryStats: vi.fn().mockResolvedValue({ metrics: [], hasFacts: false }),
}));

vi.mock('../services/syncService', () => ({
  getSyncRuns: vi.fn().mockResolvedValue([]),
  triggerSync: vi.fn(),
}));

vi.mock('../services/reportsService', () => ({
  listReports: vi.fn().mockImplementation(() => Promise.resolve(state.reports)),
  createReport: vi.fn().mockImplementation(() => {
    state.reports = [makeReport('generating')];
    return Promise.resolve(state.reports[0]);
  }),
  getReport: vi.fn().mockImplementation(() => Promise.resolve(state.reports[0])),
  getReportStatus: vi.fn().mockImplementation(() => Promise.resolve(state.reports[0])),
  getReportData: vi.fn().mockResolvedValue({
    kpis: [{ key: 'cycle', label: 'PR Cycle Time', value: 3.2, previousValue: 4.1 }],
    signals: [
      {
        id: 's1',
        reportId: 'rep-1',
        headline: 'Review latency spiked',
        severity: 'high',
        narrative: 'Median time-to-first-review doubled.',
        evidence: { fact_id: 'mf_123' },
      },
    ],
  }),
  deleteReport: vi.fn(),
}));

describe('full-app happy path', () => {
  beforeEach(() => {
    state.connected = false;
    state.repositories = [];
    state.reports = [];
  });

  it('walks onboarding → unlock → add repo → reports → generate → viewer → back', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CurrentProductProvider>
          <RepositoryListProvider>
            <MemoryRouter initialEntries={['/repositories']}>
              <AppRouter />
            </MemoryRouter>
          </RepositoryListProvider>
        </CurrentProductProvider>
      </QueryClientProvider>,
    );

    // 1. Disconnected → guard redirects to the Connector onboarding layout.
    expect(await screen.findByText('Data Sources')).toBeInTheDocument();
    expect(await screen.findByText('Install GitHub App')).toBeInTheDocument();

    // 2. Connector transitions to connected (user returns from OAuth).
    state.connected = true;
    fireEvent(window, new Event('focus'));

    // Sidebar unlocks: Settings becomes a navigable entry.
    const nav = await screen.findByRole('navigation', { name: 'Primary navigation' });
    await waitFor(() => expect(within(nav).getByText('Settings')).toBeInTheDocument());

    // 3. Go to Repository Landing via the sidebar accordion header.
    await userEvent.click(within(nav).getByText('Repositories'));
    expect(await screen.findByRole('heading', { name: 'Repositories' })).toBeInTheDocument();

    // 4. Add a repository through the dialog (the landing page's button, not
    // the sidebar accordion's navigation entry of the same name).
    const main = screen.getByRole('main');
    await userEvent.click(within(main).getByRole('button', { name: /Add Repository/i }));
    await userEvent.type(await screen.findByLabelText(/^Key/), 'checkout');
    await userEvent.type(screen.getByLabelText(/^Display name/), 'Checkout Service');
    await userEvent.type(screen.getByLabelText(/^GitHub owner/), 'acme');
    await userEvent.type(screen.getByLabelText(/^GitHub repo/), 'checkout');
    await userEvent.type(screen.getByLabelText(/^Jira project key/), 'CHK');
    await userEvent.type(screen.getByLabelText(/^Ticket key pattern/), 'CHK-*');
    await userEvent.click(screen.getByRole('button', { name: /^(Add|Create|Save)/i }));

    // The new repository card appears without a reload.
    await waitFor(() =>
      expect(screen.getAllByText('Checkout Service').length).toBeGreaterThan(0),
    );

    // 5. Open the repository workspace (defaults to Dashboard).
    await userEvent.click(screen.getAllByText('Checkout Service')[0]);
    expect(await screen.findByRole('tab', { name: 'Dashboard' })).toBeInTheDocument();

    // 6. Reports tab → generate a report.
    await userEvent.click(screen.getByRole('tab', { name: 'Reports' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Generate report' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^Period/), '2026-W27');
    await userEvent.click(within(dialog).getByRole('button', { name: /Generate/i }));

    // The generating card appears, then the poll flips it to completed.
    await waitFor(() => expect(screen.getAllByText(/weekly/i).length).toBeGreaterThan(0));
    state.reports = [makeReport('completed')];
    await client.invalidateQueries();

    // 7. Open the completed report in the viewer.
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));
    expect(await screen.findByText('Review latency spiked')).toBeInTheDocument();
    expect(screen.getByText('PR Cycle Time')).toBeInTheDocument();

    // 8. Navigate back to the Reports tab.
    await userEvent.click(screen.getByRole('tab', { name: 'Reports' }));
    expect(await screen.findByRole('button', { name: 'Generate report' })).toBeInTheDocument();
  }, 30000);
});
