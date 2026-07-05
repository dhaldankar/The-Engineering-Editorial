import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetadataPanel } from './MetadataPanel';
import * as CurrentProductContextModule from '../../contexts/CurrentProductContext';
import * as productsService from '../../services/productsService';

const mockProduct = {
  id: 'p1',
  name: 'Acme Engineering',
  description: 'Widgets',
  jiraCloudSite: 'acme.atlassian.net',
  jiraSpaceKey: 'PROJ',
};

function renderPanel() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MetadataPanel />
    </QueryClientProvider>,
  );
}

describe('MetadataPanel', () => {
  beforeEach(() => {
    vi.spyOn(CurrentProductContextModule, 'useCurrentProduct').mockReturnValue({
      product: mockProduct,
      isLoading: false,
      setProductId: vi.fn(),
    });
  });

  it('pre-populates fields from CurrentProductContext and shows the Jira space read-only', () => {
    renderPanel();
    expect(screen.getByLabelText('Project name')).toHaveValue('Acme Engineering');
    expect(screen.getByLabelText('Description')).toHaveValue('Widgets');
    expect(screen.getByText('acme.atlassian.net · PROJ')).toBeInTheDocument();
  });

  it('blocks Save with an empty Project name and does not call the API', async () => {
    const updateSpy = vi.spyOn(productsService, 'updateCurrentProduct');
    renderPanel();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Project name'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/project name is required/i)).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('shows a success confirmation on a successful save', async () => {
    vi.spyOn(productsService, 'updateCurrentProduct').mockResolvedValue({
      ...mockProduct,
      name: 'Renamed',
    });
    renderPanel();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Project name'));
    await user.type(screen.getByLabelText('Project name'), 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByTestId('metadata-save-success')).toBeInTheDocument(),
    );
  });

  it('shows an error and preserves entered values when save fails', async () => {
    vi.spyOn(productsService, 'updateCurrentProduct').mockRejectedValue(new Error('boom'));
    renderPanel();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Project name'));
    await user.type(screen.getByLabelText('Project name'), 'Attempted Rename');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByText(/failed to save project metadata/i)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Project name')).toHaveValue('Attempted Rename');
  });
});
