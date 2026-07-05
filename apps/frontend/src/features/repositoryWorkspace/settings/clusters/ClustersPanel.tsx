import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { listClusters, recomputeClusters } from '../../../../services/clustersService';
import { ClusterTable } from './ClusterTable';
import { ClusterFormDialog } from './ClusterFormDialog';
import { ImportClustersDialog } from './ImportClustersDialog';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { ErrorState } from '../../../../components/ErrorState';
import { EmptyState } from '../../../../components/EmptyState';
import type { ClusterDTO } from '../../../../types/cluster';

export function ClustersPanel() {
  const { repoId = '' } = useParams<{ repoId: string }>();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState<ClusterDTO | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [recomputeConfirmed, setRecomputeConfirmed] = useState(false);

  const clustersQuery = useQuery({
    queryKey: ['clusters', repoId],
    queryFn: () => listClusters(repoId),
  });

  const recomputeMutation = useMutation({
    mutationFn: () => recomputeClusters(repoId),
    onSuccess: () => {
      setRecomputeConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ['clusters', repoId] });
    },
  });

  const clusters = clustersQuery.data ?? [];
  const activeCount = clusters.filter((c) => c.curationStatus !== 'archived').length;

  function handleEdit(cluster: ClusterDTO) {
    setEditingCluster(cluster);
    setFormOpen(true);
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Code Areas
          </Typography>
          <Typography variant="h5">Clusters</Typography>
          <Chip label={`${activeCount} active`} size="small" sx={{ mt: 0.5 }} />
        </Box>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => setImportOpen(true)}>Import JSON</Button>
          <Button onClick={() => recomputeMutation.mutate()} disabled={recomputeMutation.isPending}>
            Recompute
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setEditingCluster(null);
              setFormOpen(true);
            }}
          >
            Add Cluster
          </Button>
        </Stack>
      </Box>

      {recomputeConfirmed && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setRecomputeConfirmed(false)}>
          Recompute started. Human-curated clusters (confirmed, renamed, or manual) are never
          overwritten by recompute — only auto-derived clusters are refreshed.
        </Alert>
      )}
      {recomputeMutation.isError && <ErrorState message="Failed to start recompute." />}

      {clustersQuery.isLoading && <LoadingSkeleton rows={4} />}
      {clustersQuery.isError && <ErrorState message="Failed to load clusters." />}
      {!clustersQuery.isLoading && !clustersQuery.isError && clusters.length === 0 && (
        <EmptyState
          title="No clusters yet"
          description="Add a cluster manually, import JSON, or run recompute after the first sync."
        />
      )}
      {clusters.length > 0 && <ClusterTable clusters={clusters} onEdit={handleEdit} />}

      <ClusterFormDialog
        repoId={repoId}
        open={formOpen}
        cluster={editingCluster}
        onClose={() => setFormOpen(false)}
      />
      <ImportClustersDialog repoId={repoId} open={importOpen} onClose={() => setImportOpen(false)} />
    </Box>
  );
}
