import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import SyncIcon from '@mui/icons-material/Sync';
import { ProjectSwitcher } from './ProjectSwitcher';
import { Breadcrumb } from './Breadcrumb';
import { SyncEventsPanel } from './SyncEventsPanel';
import { useGlobalSyncEvents } from '../../hooks/useGlobalSyncEvents';
import { signOutAndClearSession } from '../../app/RequireAuth';
import { routePaths } from '../../app/routePaths';

export function Topbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeCount } = useGlobalSyncEvents();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null);

  async function handleSignOut() {
    setAvatarAnchor(null);
    await signOutAndClearSession(queryClient);
    navigate(routePaths.login());
  }

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Engineering Insights
          </Typography>
          <ProjectSwitcher />
          <Box flex={1}>
            <Breadcrumb />
          </Box>
          <IconButton
            color="inherit"
            aria-label="Sync events"
            onClick={() => setEventsOpen(true)}
          >
            <Badge badgeContent={activeCount} color="secondary">
              <SyncIcon />
            </Badge>
          </IconButton>
          <IconButton
            aria-label="Account menu"
            onClick={(event) => setAvatarAnchor(event.currentTarget)}
          >
            <Avatar sx={{ width: 32, height: 32 }} />
          </IconButton>
          <Menu
            anchorEl={avatarAnchor}
            open={Boolean(avatarAnchor)}
            onClose={() => setAvatarAnchor(null)}
          >
            <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <SyncEventsPanel open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </>
  );
}
