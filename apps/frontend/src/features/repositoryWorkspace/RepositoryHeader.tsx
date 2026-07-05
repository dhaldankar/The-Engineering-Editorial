import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncRunPolling } from '../../hooks/useSyncRunPolling';
import { triggerSync } from '../../services/syncService';
import { getRepository } from '../../services/repositoriesService';
import { StatusChip } from '../../components/StatusChip';
import type { RepositoryDTO } from '../../types/repository';
import type { StatusKind } from '../../theme/statusColors';

export interface RepositoryHeaderProps {
  repoId: string;
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

function formatRelativeTime(iso: string | null | undefined): string {
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

export function RepositoryHeader({ repoId }: RepositoryHeaderProps) {
  const queryClient = useQueryClient();

  const repositoryQuery = useQuery({
    queryKey: ['repository', repoId],
    queryFn: () => getRepository(repoId),
  });

  const { run, status: pollStatus } = useSyncRunPolling(repoId);

  const syncMutation = useMutation({
    mutationFn: () => triggerSync(repoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncRun', repoId, 'latest'] });
    },
  });

  const repository = repositoryQuery.data;
  const effectiveStatus = pollStatus ?? repository?.status ?? 'onboarding';
  const isInProgress = !TERMINAL_STATUSES.includes(effectiveStatus);
  const isSyncDisabled = syncMutation.isPending || isInProgress;

  const lastSyncedText = isInProgress
    ? 'Syncing…'
    : formatRelativeTime(run?.completedAt ?? repository?.lastSyncedAt ?? null);

  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight="bold">
          {repository?.displayName ?? '—'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {repository ? `${repository.githubOwner}/${repository.githubRepo}` : ''}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <StatusChip
          label={effectiveStatus === 'error' ? 'Error' : effectiveStatus === 'synced' || effectiveStatus === 'completed' ? 'Synced' : 'Syncing'}
          kind={statusKindForRepository(effectiveStatus as RepositoryDTO['status'])}
        />
        <Box display="flex" alignItems="center" gap={1}>
          {isInProgress && <CircularProgress size={16} data-testid="sync-spinner" />}
          <Typography variant="body2" color="text.secondary">
            {lastSyncedText}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CheckIcon />}
          disabled={isSyncDisabled}
          onClick={() => syncMutation.mutate()}
        >
          Sync
        </Button>
      </Stack>
    </Box>
  );
}
