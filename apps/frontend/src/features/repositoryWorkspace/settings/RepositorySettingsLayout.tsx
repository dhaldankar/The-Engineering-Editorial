import { NavLink, Outlet, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { routePaths } from '../../../app/routePaths';

// repository-settings.md: "REPO SETTINGS" sub-nav — Clusters (default) and
// Connector override remain separate panels.
export function RepositorySettingsLayout() {
  const { repoId = '' } = useParams<{ repoId: string }>();

  return (
    <Box display="flex" gap={3}>
      <Box width={200} flexShrink={0}>
        <Typography variant="overline" color="text.secondary">
          Repo Settings
        </Typography>
        <List>
          <ListItemButton component={NavLink} to={routePaths.repositorySettingsClusters(repoId)}>
            <ListItemText primary="Clusters" />
          </ListItemButton>
          <ListItemButton
            component={NavLink}
            to={routePaths.repositorySettingsConnectorOverride(repoId)}
          >
            <ListItemText primary="Connector override" />
          </ListItemButton>
        </List>
      </Box>
      <Box flex={1}>
        <Outlet />
      </Box>
    </Box>
  );
}
