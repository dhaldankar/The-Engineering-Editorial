import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { RepositoryHeader } from './RepositoryHeader';
import { routePaths } from '../../app/routePaths';

const TABS = [
  { label: 'Dashboard', value: 'dashboard', path: routePaths.repositoryDashboard },
  { label: 'Reports', value: 'reports', path: routePaths.repositoryReports },
  { label: 'Settings', value: 'settings', path: routePaths.repositorySettings },
];

export function RepositoryWorkspaceLayout() {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab =
    TABS.find((tab) => location.pathname.includes(`/${tab.value}`))?.value ?? 'dashboard';

  if (!repoId) {
    return null;
  }

  return (
    <Box>
      <RepositoryHeader repoId={repoId} />
      {/* Per-tab onClick (not Tabs onChange): onChange does not fire when the
          already-selected tab is clicked, which would strand the user on a
          nested route like the Report Viewer with no way back to the list. */}
      <Tabs value={activeTab}>
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            onClick={() => navigate(tab.path(repoId))}
          />
        ))}
      </Tabs>
      <Box mt={2}>
        <Outlet />
      </Box>
    </Box>
  );
}
