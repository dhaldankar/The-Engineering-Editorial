import Box from '@mui/material/Box';
import { useConnectorStatus } from '../../hooks/useConnectorStatus';
import { OnboardingSidebar } from './OnboardingSidebar';
import { ConnectedSidebar } from './ConnectedSidebar';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function Sidebar() {
  const { connected, isLoading } = useConnectorStatus('product');

  return (
    <Box
      component="nav"
      width={240}
      flexShrink={0}
      borderRight={1}
      borderColor="divider"
      aria-label="Primary navigation"
    >
      {isLoading ? <LoadingSkeleton /> : connected ? <ConnectedSidebar /> : <OnboardingSidebar />}
    </Box>
  );
}
