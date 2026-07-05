import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useSyncRunPolling } from '../../hooks/useSyncRunPolling';
import { StatusChip } from '../../components/StatusChip';
import { MetricCard } from '../../components/MetricCard';
import type { RepositoryDTO } from '../../types/repository';
import type { StatusKind } from '../../theme/statusColors';

export interface RepositoryCardProps {
  repository: RepositoryDTO;
  onClick: (repository: RepositoryDTO) => void;
}

const TERMINAL_STATUSES = ['completed', 'failed'];

function statusKindForRepository(status: RepositoryDTO['status']): StatusKind {
  switch (status) {
    case 'synced':
      return 'success';
    case 'error':
      return 'danger';
    case 'syncing':
    case 'onboarding':
    default:
      return 'warning';
  }
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) {
    return 'Never synced';
  }
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) {
    return 'Last synced just now';
  }
  if (minutes < 60) {
    return `Last synced ${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Last synced ${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `Last synced ${days}d ago`;
}

export function RepositoryCard({ repository, onClick }: RepositoryCardProps) {
  const { status: pollStatus } = useSyncRunPolling(repository.id);

  const effectiveStatus = pollStatus ?? repository.status;
  const isInProgress = !TERMINAL_STATUSES.includes(effectiveStatus);

  return (
    <Card variant="outlined" data-testid={`repository-card-${repository.id}`}>
      <CardActionArea onClick={() => onClick(repository)}>
        <CardContent>
          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight="bold">
                {repository.displayName}
              </Typography>
              <StatusChip
                label={effectiveStatus === 'error' ? 'Error' : effectiveStatus === 'synced' ? 'Synced' : 'Syncing'}
                kind={statusKindForRepository(effectiveStatus as RepositoryDTO['status'])}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {repository.githubOwner}/{repository.githubRepo}
            </Typography>
            {isInProgress ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} data-testid="sync-spinner" />
                <Typography variant="body2" color="text.secondary">
                  First sync in progress
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {formatRelativeTime(repository.lastSyncedAt)}
              </Typography>
            )}
            <Divider />
            <MetricCard label="Hero metric" value="—" />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
