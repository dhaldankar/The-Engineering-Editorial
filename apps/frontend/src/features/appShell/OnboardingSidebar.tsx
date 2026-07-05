import { NavLink } from 'react-router-dom';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import LockIcon from '@mui/icons-material/Lock';

// app-shell.md State 1: only Connector is enabled; Settings and Repositories
// render locked with no navigation handler attached.
export function OnboardingSidebar() {
  return (
    <List>
      <ListItemButton component={NavLink} to="/connector">
        <ListItemText primary="Connector" />
      </ListItemButton>
      <ListItemButton disabled aria-disabled="true">
        <ListItemText primary="Settings" />
        <LockIcon fontSize="small" />
      </ListItemButton>
      <ListItemButton disabled aria-disabled="true">
        <ListItemText primary="Repositories" />
        <LockIcon fontSize="small" />
      </ListItemButton>
    </List>
  );
}
