import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCurrentProduct } from '../../contexts/CurrentProductContext';
import { updateCurrentProduct } from '../../services/productsService';
import { ErrorState } from '../../components/ErrorState';

export function MetadataPanel() {
  const { product, isLoading } = useCurrentProduct();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? '');
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: updateCurrentProduct,
    onSuccess: () => {
      setSaveSucceeded(true);
      queryClient.invalidateQueries({ queryKey: ['currentProduct'] });
    },
  });

  function handleSave() {
    setSaveSucceeded(false);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Project name is required.');
      return;
    }
    setNameError(null);
    mutation.mutate({ name: trimmedName, description: description.trim() ? description : null });
  }

  if (isLoading) {
    return <Typography>Loading…</Typography>;
  }

  if (!product) {
    return <ErrorState message="Unable to load Project metadata." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Project
          </Typography>
          <Typography variant="h5">Metadata</Typography>
          <Typography variant="body2" color="text.secondary">
            Identity for this Project (1-1 with its JIRA space).
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleSave} disabled={mutation.isPending}>
          Save
        </Button>
      </Box>

      {saveSucceeded && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="metadata-save-success">
          Project metadata saved.
        </Alert>
      )}
      {mutation.isError && (
        <ErrorState message="Failed to save Project metadata. Please try again." />
      )}

      <Stack spacing={2} maxWidth={480}>
        <TextField
          label="Project name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) {
              setNameError(null);
            }
          }}
          error={Boolean(nameError)}
          helperText={nameError}
          fullWidth
        />
        <TextField
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short summary shown on dashboards"
          fullWidth
        />
      </Stack>

      <Box mt={3}>
        <Typography variant="subtitle2" color="text.secondary">
          JIRA space
        </Typography>
        <Typography variant="body1">
          {product.jiraCloudSite && product.jiraSpaceKey
            ? `${product.jiraCloudSite} · ${product.jiraSpaceKey}`
            : 'No JIRA space linked yet.'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Connection managed under JIRA Configuration; status→phase under JIRA Workflow Mapping.
        </Typography>
      </Box>
    </Box>
  );
}
