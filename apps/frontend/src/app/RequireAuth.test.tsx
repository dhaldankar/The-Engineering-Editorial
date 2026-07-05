import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
}));

import { getCurrentUser } from 'aws-amplify/auth';

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  it('redirects to /login when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('no session'));
    renderGuarded();
    await waitFor(() => expect(screen.getByText('Login Screen')).toBeInTheDocument());
  });

  it('renders children when authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({} as never);
    renderGuarded();
    await waitFor(() => expect(screen.getByText('Protected Content')).toBeInTheDocument());
  });
});
