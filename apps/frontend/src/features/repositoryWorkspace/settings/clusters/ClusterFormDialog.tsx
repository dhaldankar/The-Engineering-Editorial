import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { createCluster, updateCluster } from '../../../../services/clustersService';
import type { ClusterDTO } from '../../../../types/cluster';

interface ClusterFormDialogProps {
  repoId: string;
  open: boolean;
  cluster: ClusterDTO | null; // null = create mode
  onClose: () => void;
}

// curation_status is intentionally not editable here — it is derived
// server-side by recompute/curation actions.
export function ClusterFormDialog({ repoId, open, cluster, onClose }: ClusterFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [filePattern, setFilePattern] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(cluster?.name ?? '');
      setFilePattern(cluster?.filePattern ?? '');
      setValidationError(null);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cluster]);

  const mutation = useMutation({
    mutationFn: () =>
      cluster
        ? updateCluster(repoId, cluster.id, { name, filePattern })
        : createCluster(repoId, { name, filePattern }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters', repoId] });
      onClose();
    },
  });

  function handleSubmit() {
    if (!name.trim() || !filePattern.trim()) {
      setValidationError('Name and file pattern are both required.');
      return;
    }
    setValidationError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{cluster ? 'Edit cluster' : 'Add cluster'}</DialogTitle>
      <DialogContent>
        {validationError && <Alert severity="warning" sx={{ mb: 2 }}>{validationError}</Alert>}
        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to save the cluster. Your entered values are preserved — please retry.
          </Alert>
        )}
        <Stack spacing={2} mt={1}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField
            label="File pattern"
            value={filePattern}
            onChange={(e) => setFilePattern(e.target.value)}
            placeholder="src/payments/**"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
