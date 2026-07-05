import { useMemo } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  createReport,
  getReport,
  getReportData,
  listReports,
} from '../../services/reportsService';
import { ApiError } from '../../services/apiClient';
import { useReportStatusPolling } from '../../hooks/useReportStatusPolling';
import { StatusChip } from '../../components/StatusChip';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ReportKpiStrip } from './ReportKpiStrip';
import { SignalCard } from './SignalCard';
import { ReportGenerationProgress } from './ReportGenerationProgress';
import { routePaths } from '../../app/routePaths';

export function ReportViewerPage() {
  const { repoId = '', reportId = '' } = useParams<{ repoId: string; reportId: string }>();
  const navigate = useNavigate();

  const reportQuery = useQuery({
    queryKey: ['report', repoId, reportId],
    queryFn: () => getReport(repoId, reportId),
    retry: false,
  });

  // Live status poll; while non-terminal this drives the progress view and its
  // completion flips the layout without a reload (Requirement 9.5).
  const { status: polledStatus } = useReportStatusPolling(repoId, reportId);
  const status = polledStatus ?? reportQuery.data?.status;
  const isCompleted = status === 'completed';

  const dataQuery = useQuery({
    queryKey: ['reportData', repoId, reportId],
    queryFn: () => getReportData(repoId, reportId),
    enabled: isCompleted,
  });

  const siblingsQuery = useQuery({
    queryKey: ['reports', repoId],
    queryFn: () => listReports(repoId),
    enabled: Boolean(reportQuery.data),
  });

  const { prevReport, nextReport } = useMemo(() => {
    const report = reportQuery.data;
    const siblings = (siblingsQuery.data ?? [])
      .filter((item) => item.reportType === report?.reportType)
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
    const index = siblings.findIndex((item) => item.id === reportId);
    return {
      prevReport: index > 0 ? siblings[index - 1] : null,
      nextReport: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null,
    };
  }, [siblingsQuery.data, reportQuery.data, reportId]);

  const regenerateMutation = useMutation({
    mutationFn: () =>
      createReport(repoId, {
        reportType: reportQuery.data!.reportType,
        period: reportQuery.data!.period,
      }),
    onSuccess: (created) => {
      navigate(routePaths.reportViewer(repoId, created.id));
    },
  });

  if (reportQuery.isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (reportQuery.isError) {
    const notFound = reportQuery.error instanceof ApiError && reportQuery.error.status === 404;
    return (
      <ErrorState
        message={notFound ? 'This report no longer exists.' : 'Failed to load this report.'}
        action={
          <Button component={RouterLink} to={routePaths.repositoryReports(repoId)}>
            Back to Reports
          </Button>
        }
      />
    );
  }

  const report = reportQuery.data!;

  if (!isCompleted) {
    return <ReportGenerationProgress repoId={repoId} reportId={reportId} />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {report.reportType} · {report.period}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
            <StatusChip label="Completed" kind="success" />
            <Typography variant="body2" color="text.secondary">
              {report.periodStart} – {report.periodEnd}
              {report.generatedAt ? ` · generated ${report.generatedAt}` : ''}
            </Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            disabled={!prevReport}
            onClick={() => prevReport && navigate(routePaths.reportViewer(repoId, prevReport.id))}
          >
            ‹ Prev
          </Button>
          <Button
            disabled={!nextReport}
            onClick={() => nextReport && navigate(routePaths.reportViewer(repoId, nextReport.id))}
          >
            Next ›
          </Button>
          <Button
            variant="outlined"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
          >
            Regenerate
          </Button>
        </Stack>
      </Box>

      {dataQuery.isLoading && <LoadingSkeleton rows={2} />}
      {dataQuery.isError && <ErrorState message="Failed to load report data." />}
      {dataQuery.data && (
        <>
          <ReportKpiStrip kpis={dataQuery.data.kpis} />
          <Typography variant="h6" mt={4} mb={2}>
            This period&apos;s signals
          </Typography>
          <Stack spacing={2}>
            {dataQuery.data.signals.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No signals fired this period.
              </Typography>
            ) : (
              dataQuery.data.signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))
            )}
          </Stack>
        </>
      )}
    </Box>
  );
}
