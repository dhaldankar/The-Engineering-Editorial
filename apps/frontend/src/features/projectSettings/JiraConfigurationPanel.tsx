import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { useCurrentProduct } from '../../contexts/CurrentProductContext';
import { useConnectorStatus } from '../../hooks/useConnectorStatus';
import { StatusChip } from '../../components/StatusChip';
import { routePaths } from '../../app/routePaths';

export function JiraConfigurationPanel() {
  const { product } = useCurrentProduct();
  const { connected, isLoading } = useConnectorStatus('product');

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        JIRA
      </Typography>
      <Typography variant="h5" gutterBottom>
        JIRA Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Read-only summary of this Project&apos;s linked JIRA connection.
      </Typography>

      <Stack spacing={1.5} maxWidth={480}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Cloud site
          </Typography>
          <Typography variant="body1">{product?.jiraCloudSite ?? 'Not connected'}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Space key
          </Typography>
          <Typography variant="body1">{product?.jiraSpaceKey ?? 'Not connected'}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Status
          </Typography>
          {isLoading ? (
            <Typography variant="body2">Checking…</Typography>
          ) : (
            <StatusChip
              label={connected ? 'Connected' : 'Disconnected'}
              kind={connected ? 'success' : 'danger'}
            />
          )}
        </Box>
      </Stack>

      <Box mt={3}>
        <Link component={RouterLink} to={routePaths.connector()}>
          Manage connection on the Connector screen
        </Link>
      </Box>
    </Box>
  );
}
