import { NavLink, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { routePaths } from '../../app/routePaths';

const navLinkSx = {
  borderRadius: 1,
  '&.active': {
    fontWeight: 700,
  },
};

export function ProjectSettingsLayout() {
  return (
    <Box display="flex" gap={3}>
      <Box width={200} flexShrink={0}>
        <Typography variant="overline" color="text.secondary">
          Project Settings
        </Typography>
        <List>
          <ListItemButton
            component={NavLink}
            to={routePaths.settingsMetadata()}
            sx={navLinkSx}
          >
            <ListItemText primary="Metadata" />
          </ListItemButton>
          <Tooltip title="User Access is planned post-MVP and is not yet available.">
            <span>
              <ListItemButton disabled aria-disabled="true">
                <ListItemText primary="User Access" secondary="locked" />
              </ListItemButton>
            </span>
          </Tooltip>
          <ListItemButton
            component={NavLink}
            to={routePaths.settingsWorkflowMapping()}
            sx={navLinkSx}
          >
            <ListItemText primary="JIRA Workflow Mapping" />
          </ListItemButton>
          <ListItemButton
            component={NavLink}
            to={routePaths.settingsJiraConfiguration()}
            sx={navLinkSx}
          >
            <ListItemText primary="JIRA Configuration" />
          </ListItemButton>
        </List>
      </Box>
      <Box flex={1}>
        <Outlet />
      </Box>
    </Box>
  );
}
