import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { GitHubConnectorCard } from './GitHubConnectorCard';
import { JiraConnectorCard } from './JiraConnectorCard';

// The Project Connector screen represents only the Project-level (default)
// connector (Requirement 3.6); a repository-scoped override is managed by
// ConnectorOverridePanel (Phase 11), which reuses these same cards with
// scope="repository".
export function ConnectorPage() {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        Data Sources
      </Typography>
      <Typography variant="h5" fontWeight="bold">
        Connector
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        GitHub and Jira connections for this Project. Repositories inherit these unless they
        set an override.
      </Typography>

      <Stack spacing={3}>
        <Box component="section">
          <GitHubConnectorCard scope="product" />
        </Box>
        <Box component="section">
          <JiraConnectorCard scope="product" />
        </Box>
      </Stack>

      <Box mt={3}>
        <Typography variant="body2" color="text.secondary">
          OAuth 2.0 / scoped tokens only. No raw credentials stored, keys rotate via versioned
          columns without re-auth, and tokens are never returned to the frontend.
        </Typography>
      </Box>
    </Box>
  );
}
