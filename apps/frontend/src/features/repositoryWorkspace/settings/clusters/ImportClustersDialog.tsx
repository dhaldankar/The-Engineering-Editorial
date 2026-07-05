import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { importClusters } from '../../../../services/clustersService';
import type { ImportClustersPayload } from '../../../../types/cluster';

interface ImportClustersDialogProps {
  repoId: string;
  open: boolean;
  onClose: () => void;
}

export function ImportClustersDialog({ repoId, open, onClose }: ImportClustersDialogProps) {
  const queryClient = useQueryClient();
  const [json, setJson] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (open) {
      setJson('');
      setValidationError(null);
      setSucceeded(false);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useMutation({
    mutationFn: (payload: ImportClustersPayload) => importClusters(repoId, payload),
    onSuccess: () => {
      setSucceeded(true);
      queryClient.invalidateQueries({ queryKey: ['clusters', repoId] });
    },
  });

  function handleSubmit() {
    setSucceeded(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setValidationError('Invalid JSON — please check the payload and retry.');
      return;
    }
    setValidationError(null);
    mutation.mutate(parsed as ImportClustersPayload);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Import clusters (JSON)</DialogTitle>
      <DialogContent>
        {validationError && <Alert severity="warning" sx={{ mb: 2 }}>{validationError}</Alert>}
        {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Import failed. Please retry.</Alert>}
        {succeeded && <Alert severity="success" sx={{ mb: 2 }}>Clusters imported.</Alert>}
        <TextField
          label="JSON payload"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          multiline
          minRows={8}
          fullWidth
          sx={{ mt: 1 }}
          placeholder='{"clusters": [{"name": "Payments", "filePattern": "src/payments/**"}]}'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}
