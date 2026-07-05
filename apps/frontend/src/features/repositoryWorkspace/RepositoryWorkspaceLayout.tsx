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
      <Tabs
        value={activeTab}
        onChange={(_event, value: string) => {
          const tab = TABS.find((t) => t.value === value);
          if (tab) {
            navigate(tab.path(repoId));
          }
        }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>
      <Box mt={2}>
        <Outlet />
      </Box>
    </Box>
  );
}
