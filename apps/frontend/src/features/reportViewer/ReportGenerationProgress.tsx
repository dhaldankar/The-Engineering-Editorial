import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useReportStatusPolling } from '../../hooks/useReportStatusPolling';

interface ReportGenerationProgressProps {
  repoId: string;
  reportId: string;
}

// Rendered while a report's status is not yet 'completed' (Requirement 9.5);
// the parent switches to the brief layout when the poll reports completed.
export function ReportGenerationProgress({ repoId, reportId }: ReportGenerationProgressProps) {
  const { status, stage, progress } = useReportStatusPolling(repoId, reportId);

  return (
    <Box textAlign="center" py={6} data-testid="report-generation-progress">
      <CircularProgress />
      <Typography variant="h6" mt={2}>
        {status === 'failed' ? 'Report generation failed' : 'Generating report…'}
      </Typography>
      {stage && (
        <Typography variant="body2" color="text.secondary">
          Stage: {stage}
        </Typography>
      )}
      {progress !== null && (
        <Box maxWidth={360} mx="auto" mt={2}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
    </Box>
  );
}
