import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { createReport } from '../../../services/reportsService';
import { ApiError } from '../../../services/apiClient';
import type { AsyncReportDTO } from '../../../types/report';

export interface GenerateReportDialogProps {
  repoId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (report: AsyncReportDTO) => void;
}

const REPORT_TYPES = [{ value: 'weekly', label: 'Weekly Editorial' }, { value: 'monthly', label: 'Monthly Rollup' }];

export function GenerateReportDialog({
  repoId,
  open,
  onClose,
  onCreated,
}: GenerateReportDialogProps) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [period, setPeriod] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!period.trim()) {
      setError('Period is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const report = await createReport(repoId, { reportType, period: period.trim() });
      onCreated(report);
      setPeriod('');
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('A report for this period already exists.');
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Generate a report</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            select
            label="Report type"
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
          >
            {REPORT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Period"
            placeholder="e.g. 2026-W07"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          Generate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
