import { useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useGlobalSyncEvents, type SyncEvent } from '../../hooks/useGlobalSyncEvents';
import { StatusChip } from '../../components/StatusChip';
import { EmptyState } from '../../components/EmptyState';
import { routePaths } from '../../app/routePaths';
import type { StatusKind } from '../../theme/statusColors';

interface SyncEventsPanelProps {
  open: boolean;
  onClose: () => void;
}

function statusKind(status: string): StatusKind {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'danger';
  return 'warning';
}

const EVENT_LABELS: Record<SyncEvent['type'], string> = {
  sync: 'Sync',
  aggregation: 'Aggregation',
  report: 'Report',
};

export function SyncEventsPanel({ open, onClose }: SyncEventsPanelProps) {
  const { events } = useGlobalSyncEvents();
  const navigate = useNavigate();

  function handleEventClick(event: SyncEvent) {
    onClose();
    if (event.type === 'report' && event.reportId) {
      navigate(routePaths.reportViewer(event.repositoryId, event.reportId));
    } else if (event.type === 'report') {
      navigate(routePaths.repositoryReports(event.repositoryId));
    } else {
      navigate(routePaths.repositoryDashboard(event.repositoryId));
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box width={360} p={2} role="region" aria-label="Sync events">
        <Typography variant="h6" gutterBottom>
          Sync events
        </Typography>
        {events.length === 0 ? (
          <EmptyState title="No recent events" description="Sync, aggregation, and report jobs will appear here." />
        ) : (
          <List>
            {events.map((event, index) => (
              <ListItemButton key={`${event.type}-${event.repositoryId}-${event.reportId ?? index}`} onClick={() => handleEventClick(event)}>
                <ListItemText
                  primary={`${EVENT_LABELS[event.type]} · ${event.repositoryId}`}
                  secondary={event.relativeTime ?? undefined}
                />
                <StatusChip label={event.status} kind={statusKind(event.status)} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
