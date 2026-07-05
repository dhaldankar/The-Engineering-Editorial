import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import * as useConnectorStatusModule from '../../hooks/useConnectorStatus';
import * as repoListContext from '../../contexts/RepositoryListContext';
import type { RepositoryDTO } from '../../types/repository';

const repositories: RepositoryDTO[] = [
  {
    id: 'repo-1',
    key: 'checkout',
    displayName: 'Checkout Service',
    status: 'synced',
    githubOwner: 'acme',
    githubRepo: 'checkout',
    jiraProjectKey: 'CHK',
    ticketKeyPattern: 'CHK-*',
    lastSyncedAt: null,
  },
];

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/repositories']}>
      <Routes>
        <Route path="*" element={<Sidebar />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.spyOn(repoListContext, 'useRepositoryList').mockReturnValue({
      repositories,
      isLoading: false,
    });
  });

  it('renders locked Settings/Repositories without navigation in the onboarding state', () => {
    vi.spyOn(useConnectorStatusModule, 'useConnectorStatus').mockReturnValue({
      connected: false,
      isLoading: false,
      error: null,
    });
    renderSidebar();

    expect(screen.getByText('Connector')).toBeInTheDocument();
    const settings = screen.getByText('Settings').closest('[aria-disabled="true"], .Mui-disabled');
    expect(settings).not.toBeNull();
    const repos = screen.getByText('Repositories').closest('[aria-disabled="true"], .Mui-disabled');
    expect(repos).not.toBeNull();
  });

  it('lists repository names in the connected state', async () => {
    vi.spyOn(useConnectorStatusModule, 'useConnectorStatus').mockReturnValue({
      connected: true,
      isLoading: false,
      error: null,
    });
    renderSidebar();

    expect(screen.getByText('Checkout Service')).toBeInTheDocument();
    expect(screen.getByText('Add Repository')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Checkout Service'));
  });
});
