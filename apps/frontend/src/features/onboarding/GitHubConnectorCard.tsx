import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { testConnector } from '../../services/connectorService';
import type { ConnectorScope } from '../../types/connector';
import { StatusChip } from '../../components/StatusChip';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ErrorState } from '../../components/ErrorState';

export interface GitHubConnectorCardProps {
  scope: ConnectorScope;
  id?: string;
}

// The GitHub App installation handshake itself is a separate deployable
// (integration-github, per architecture.md Section 3). This component only
// initiates the redirect and reacts to the user's return to this app.
const GITHUB_APP_INSTALL_URL: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_GITHUB_APP_INSTALL_URL ?? '/integrations/github/install';

export function GitHubConnectorCard({ scope, id }: GitHubConnectorCardProps) {
  const queryClient = useQueryClient();
  const queryKey = ['connectorStatus', scope, id, 'github'];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: () => testConnector(scope, 'github', id),
  });

  // When the user leaves to complete the GitHub App install and returns to
  // this tab, re-run the connectivity test so status reflects reality
  // without a manual page refresh (Requirement 3.2).
  useEffect(() => {
    function handleFocus() {
      queryClient.invalidateQueries({ queryKey });
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, scope, id]);

  function handleInstall() {
    window.location.assign(GITHUB_APP_INSTALL_URL);
  }

  function handleManage() {
    window.location.assign(GITHUB_APP_INSTALL_URL);
  }

  function handleTest() {
    void refetch();
  }

  if (isLoading) {
    return (
      <Box data-testid="github-connector-card">
        <LoadingSkeleton rows={2} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box data-testid="github-connector-card">
        <ErrorState message="Unable to check the GitHub connection." variant="server" />
      </Box>
    );
  }

  const connected = Boolean(data?.connected);

  if (!connected) {
    return (
      <Box data-testid="github-connector-card">
        <Typography variant="subtitle1" fontWeight="bold">
          GitHub App
        </Typography>
        <Typography variant="body2" color="text.secondary">
          PRs, reviews, file diffs
        </Typography>
        <Box mt={1}>
          <Button variant="contained" onClick={handleInstall}>
            Install GitHub App
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box data-testid="github-connector-card">
      <Typography variant="subtitle1" fontWeight="bold">
        GitHub
      </Typography>
      <Box mt={1}>
        <StatusChip label="Connected" kind="success" />
      </Box>
      <Typography variant="body2" color="text.secondary" mt={1}>
        Installation: {data?.installationOrAccount} · token v{data?.tokenVersion}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Last rotated {data?.lastRotatedAt}
      </Typography>
      <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1}>
        <Button onClick={handleTest} disabled={isFetching}>
          Test
        </Button>
        <Button onClick={handleManage}>Manage</Button>
      </Stack>
    </Box>
  );
}
