import { Navigate, Outlet } from 'react-router-dom';
import { useConnectorStatus } from '../hooks/useConnectorStatus';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function RequireConnector() {
  const { connected, isLoading } = useConnectorStatus('product');

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!connected) {
    return <Navigate to="/connector" replace />;
  }

  return <Outlet />;
}
