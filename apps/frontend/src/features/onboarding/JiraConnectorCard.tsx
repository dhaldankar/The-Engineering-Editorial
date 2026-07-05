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

export interface JiraConnectorCardProps {
  scope: ConnectorScope;
  id?: string;
}

// The Atlassian 3LO OAuth handshake itself is a separate deployable
// (integration-jira, per architecture.md Section 3). This component only
// initiates the redirect and reacts to the user's return to this app.
const JIRA_OAUTH_URL: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_JIRA_OAUTH_URL ?? '/integrations/jira/oauth';

export function JiraConnectorCard({ scope, id }: JiraConnectorCardProps) {
  const queryClient = useQueryClient();
  const queryKey = ['connectorStatus', scope, id, 'jira'];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: () => testConnector(scope, 'jira', id),
  });

  // When the user leaves to complete the Atlassian OAuth handshake and
  // returns to this tab, re-run the connectivity test so status reflects
  // reality without a manual page refresh (Requirement 3.3).
  useEffect(() => {
    function handleFocus() {
      queryClient.invalidateQueries({ queryKey });
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, scope, id]);

  function handleConnect() {
    window.location.assign(JIRA_OAUTH_URL);
  }

  function handleReauth() {
    window.location.assign(JIRA_OAUTH_URL);
  }

  function handleTest() {
    void refetch();
  }

  if (isLoading) {
    return (
      <Box data-testid="jira-connector-card">
        <LoadingSkeleton rows={2} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box data-testid="jira-connector-card">
        <ErrorState message="Unable to check the Jira connection." variant="server" />
      </Box>
    );
  }

  const connected = Boolean(data?.connected);

  if (!connected) {
    return (
      <Box data-testid="jira-connector-card">
        <Typography variant="subtitle1" fontWeight="bold">
          Jira Software
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Issues, transitions, assignments
        </Typography>
        <Box mt={1}>
          <Button variant="contained" onClick={handleConnect}>
            Connect Jira
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box data-testid="jira-connector-card">
      <Typography variant="subtitle1" fontWeight="bold">
        Jira
      </Typography>
      <Box mt={1}>
        <StatusChip label="Connected" kind="success" />
      </Box>
      <Typography variant="body2" color="text.secondary" mt={1}>
        Cloud: {data?.cloudSite} · token v{data?.tokenVersion}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Space: {data?.spaceKey}
      </Typography>
      <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1}>
        <Button onClick={handleTest} disabled={isFetching}>
          Test
        </Button>
        <Button onClick={handleReauth}>Re-auth</Button>
      </Stack>
    </Box>
  );
}
