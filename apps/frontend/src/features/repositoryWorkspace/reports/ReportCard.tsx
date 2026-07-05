import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { StatusChip } from '../../../components/StatusChip';
import { useReportStatusPolling } from '../../../hooks/useReportStatusPolling';
import { deleteReport, createReport } from '../../../services/reportsService';
import { routePaths } from '../../../app/routePaths';
import type { AsyncReportDTO } from '../../../types/report';

export interface ReportCardProps {
  repoId: string;
  report: AsyncReportDTO;
  onDeleted?: (reportId: string) => void;
}

function reportTitle(report: AsyncReportDTO): string {
  return `${report.reportType} · ${report.period}`;
}

export function ReportCard({ repoId, report, onDeleted }: ReportCardProps) {
  const navigate = useNavigate();
  const { report: liveReport, status, stage, progress } = useReportStatusPolling(
    repoId,
    report.id,
  );
  const current = liveReport ?? report;

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const effectiveStatus = status ?? current.status;

  async function handleDelete() {
    setMenuAnchor(null);
    setIsDeleting(true);
    try {
      await deleteReport(repoId, report.id);
      onDeleted?.(report.id);
    } catch {
      setIsDeleting(false);
    }
  }

  async function handleRetry() {
    setIsRetrying(true);
    try {
      await createReport(repoId, {
        reportType: current.reportType,
        period: current.period,
      });
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <Card
      variant="outlined"
      data-testid="report-card"
      data-status={effectiveStatus}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="subtitle1" fontWeight={600}>
            {reportTitle(current)}
          </Typography>
          {effectiveStatus === 'completed' && (
            <IconButton
              aria-label="report actions"
              size="small"
              onClick={(event) => setMenuAnchor(event.currentTarget)}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {effectiveStatus === 'completed' && (
          <>
            <StatusChip label="Completed" kind="success" />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Generated{' '}
              {current.generatedAt
                ? new Date(current.generatedAt).toLocaleString()
                : 'recently'}{' '}
              · {current.signalCount ?? 0} signal{current.signalCount === 1 ? '' : 's'}
            </Typography>
            <Stack direction="row" justifyContent="flex-end" mt={2}>
              <Button
                size="small"
                onClick={() => navigate(routePaths.reportViewer(repoId, current.id))}
              >
                Open
              </Button>
            </Stack>
          </>
        )}

        {effectiveStatus !== 'completed' && effectiveStatus !== 'failed' && (
          <>
            <Stack direction="row" spacing={1} alignItems="center" mt={1}>
              <CircularProgress size={16} />
              <Typography variant="body2">Generating...</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress ?? 0}
              sx={{ mt: 1 }}
            />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Stage: {stage ?? current.stage ?? 'pending'}
            </Typography>
          </>
        )}

        {effectiveStatus === 'failed' && (
          <>
            <StatusChip label="Failed" kind="danger" />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Retry {current.retryCount} of 3
            </Typography>
            {showError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {current.errorMessage ?? 'Unknown error'}
              </Alert>
            )}
            <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
              <Button size="small" onClick={() => setShowError(true)}>
                View error
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={isRetrying}
                onClick={handleRetry}
              >
                Retry
              </Button>
            </Stack>
          </>
        )}

        {isDeleting && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Deleting...
            </Typography>
          </Box>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}
