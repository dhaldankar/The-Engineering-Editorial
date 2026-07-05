import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireConnector } from './RequireConnector';
import * as useConnectorStatusModule from '../hooks/useConnectorStatus';

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/repositories']}>
      <Routes>
        <Route path="/connector" element={<div>Connector Screen</div>} />
        <Route element={<RequireConnector />}>
          <Route path="/repositories" element={<div>Repositories Screen</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireConnector', () => {
  it('redirects to /connector when not connected', () => {
    vi.spyOn(useConnectorStatusModule, 'useConnectorStatus').mockReturnValue({
      connected: false,
      isLoading: false,
      error: null,
    });
    renderGuarded();
    expect(screen.getByText('Connector Screen')).toBeInTheDocument();
  });

  it('renders children when connected', () => {
    vi.spyOn(useConnectorStatusModule, 'useConnectorStatus').mockReturnValue({
      connected: true,
      isLoading: false,
      error: null,
    });
    renderGuarded();
    expect(screen.getByText('Repositories Screen')).toBeInTheDocument();
  });
});
