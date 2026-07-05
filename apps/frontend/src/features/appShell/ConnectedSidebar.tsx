import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { useRepositoryList } from '../../contexts/RepositoryListContext';
import { routePaths } from '../../app/routePaths';

// app-shell.md State 2: Connector, Settings, and a Repositories accordion.
export function ConnectedSidebar() {
  const { repositories } = useRepositoryList();
  const navigate = useNavigate();
  const [reposExpanded, setReposExpanded] = useState(true);

  function handleAccordionHeaderClick() {
    // Navigates to Repository Landing (Requirement 2.4) and toggles expansion.
    setReposExpanded((prev) => !prev);
    navigate(routePaths.repositories());
  }

  return (
    <List>
      <ListItemButton component={NavLink} to={routePaths.connector()}>
        <ListItemText primary="Connector" />
      </ListItemButton>
      <ListItemButton component={NavLink} to={routePaths.settings()}>
        <ListItemText primary="Settings" />
      </ListItemButton>
      <ListItemButton onClick={handleAccordionHeaderClick} aria-label="Repositories">
        <ListItemText primary="Repositories" />
        {reposExpanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={reposExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {repositories.map((repo) => (
            <ListItemButton
              key={repo.id}
              sx={{ pl: 4 }}
              onClick={() => navigate(routePaths.repositoryDashboard(repo.id))}
            >
              <ListItemText primary={repo.displayName} />
            </ListItemButton>
          ))}
          <ListItemButton sx={{ pl: 4 }} onClick={() => navigate(routePaths.repositories())}>
            <AddIcon fontSize="small" sx={{ mr: 1 }} />
            <ListItemText primary="Add Repository" />
          </ListItemButton>
        </List>
      </Collapse>
    </List>
  );
}
