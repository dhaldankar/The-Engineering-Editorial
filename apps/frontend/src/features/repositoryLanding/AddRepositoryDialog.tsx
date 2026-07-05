import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { createRepository } from '../../services/repositoriesService';
import { ApiError } from '../../services/apiClient';
import type { CreateRepositoryInput, RepositoryDTO } from '../../types/repository';

export interface AddRepositoryDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (repository: RepositoryDTO) => void;
}

const EMPTY_FORM: CreateRepositoryInput = {
  key: '',
  displayName: '',
  githubOwner: '',
  githubRepo: '',
  jiraProjectKey: '',
  ticketKeyPattern: '',
};

type FieldErrors = Partial<Record<keyof CreateRepositoryInput, string>>;

const REQUIRED_FIELDS: Array<keyof CreateRepositoryInput> = [
  'key',
  'displayName',
  'githubOwner',
  'githubRepo',
  'jiraProjectKey',
  'ticketKeyPattern',
];

const FIELD_LABELS: Record<keyof CreateRepositoryInput, string> = {
  key: 'Key',
  displayName: 'Display name',
  githubOwner: 'GitHub owner',
  githubRepo: 'GitHub repo',
  jiraProjectKey: 'Jira project key',
  ticketKeyPattern: 'Ticket key pattern',
};

export function AddRepositoryDialog({ open, onClose, onCreated }: AddRepositoryDialogProps) {
  const [form, setForm] = useState<CreateRepositoryInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof CreateRepositoryInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    onClose();
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    for (const field of REQUIRED_FIELDS) {
      if (!form[field].trim()) {
        errors[field] = `${FIELD_LABELS[field]} is required`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const repository = await createRepository(form);
      onCreated(repository);
      setForm(EMPTY_FORM);
      setFieldErrors({});
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFieldErrors((prev) => ({
          ...prev,
          key: 'A repository with this key already exists in this Project',
        }));
      } else {
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to create repository. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Repository</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField
            label="Key"
            required
            value={form.key}
            onChange={(event) => handleChange('key', event.target.value)}
            error={Boolean(fieldErrors.key)}
            helperText={fieldErrors.key}
          />
          <TextField
            label="Display name"
            required
            value={form.displayName}
            onChange={(event) => handleChange('displayName', event.target.value)}
            error={Boolean(fieldErrors.displayName)}
            helperText={fieldErrors.displayName}
          />
          <TextField
            label="GitHub owner"
            required
            value={form.githubOwner}
            onChange={(event) => handleChange('githubOwner', event.target.value)}
            error={Boolean(fieldErrors.githubOwner)}
            helperText={fieldErrors.githubOwner}
          />
          <TextField
            label="GitHub repo"
            required
            value={form.githubRepo}
            onChange={(event) => handleChange('githubRepo', event.target.value)}
            error={Boolean(fieldErrors.githubRepo)}
            helperText={fieldErrors.githubRepo}
          />
          <TextField
            label="Jira project key"
            required
            value={form.jiraProjectKey}
            onChange={(event) => handleChange('jiraProjectKey', event.target.value)}
            error={Boolean(fieldErrors.jiraProjectKey)}
            helperText={fieldErrors.jiraProjectKey}
          />
          <TextField
            label="Ticket key pattern"
            required
            value={form.ticketKeyPattern}
            onChange={(event) => handleChange('ticketKeyPattern', event.target.value)}
            error={Boolean(fieldErrors.ticketKeyPattern)}
            helperText={fieldErrors.ticketKeyPattern}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          Add Repository
        </Button>
      </DialogActions>
    </Dialog>
  );
}
