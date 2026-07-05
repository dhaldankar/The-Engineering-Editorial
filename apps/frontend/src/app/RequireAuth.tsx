import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function useAuthSession() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    getCurrentUser()
      .then(() => setStatus('authenticated'))
      .catch(() => setStatus('unauthenticated'));
  }, []);

  return status;
}

export function RequireAuth() {
  const status = useAuthSession();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingSkeleton />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export async function signOutAndClearSession(queryClient: ReturnType<typeof useQueryClient>) {
  await signOut();
  queryClient.clear();
}
