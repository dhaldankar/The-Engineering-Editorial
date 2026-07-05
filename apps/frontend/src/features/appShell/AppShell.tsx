import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

// Pure layout composition: topbar row, then 240px sidebar + flexible content.
export function AppShell() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Topbar />
      <Box display="flex" flex={1}>
        <Sidebar />
        <Box component="main" flex={1} p={3}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
