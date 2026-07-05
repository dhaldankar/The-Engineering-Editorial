import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getConnector } from '../../../../services/connectorService';
import { GitHubConnectorCard } from '../../../onboarding/GitHubConnectorCard';
import { JiraConnectorCard } from '../../../onboarding/JiraConnectorCard';

// Reuses the Project Connector cards with repository scope (Requirement 10.7).
// The repository→product fallback is resolved by the backend; this panel only
// displays which case currently applies.
export function ConnectorOverridePanel() {
  const { repoId = '' } = useParams<{ repoId: string }>();

  const overrideQuery = useQuery({
    queryKey: ['connectorOverride', repoId],
    queryFn: async () => {
      const [github, jira] = await Promise.allSettled([
        getConnector('repository', 'github', repoId),
        getConnector('repository', 'jira', repoId),
      ]);
      const isOverride = (result: PromiseSettledResult<{ isOverride?: boolean }>) =>
        result.status === 'fulfilled' && Boolean(result.value.isOverride ?? true);
      return isOverride(github) || isOverride(jira);
    },
  });

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        Access
      </Typography>
      <Typography variant="h5" gutterBottom>
        Connector override
      </Typography>

      {overrideQuery.data === true && (
        <Alert severity="info" sx={{ mb: 2 }} data-testid="override-active">
          This repository uses its own connector override.
        </Alert>
      )}
      {overrideQuery.data === false && (
        <Alert severity="info" sx={{ mb: 2 }} data-testid="override-fallback">
          No override configured — this repository falls back to the Project-level connector.
        </Alert>
      )}

      <Stack spacing={3}>
        <GitHubConnectorCard scope="repository" id={repoId} />
        <JiraConnectorCard scope="repository" id={repoId} />
      </Stack>
    </Box>
  );
}
