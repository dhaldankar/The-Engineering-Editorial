import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/CardActionArea';
import CardBase from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import { useReports } from '../../../hooks/useReports';
import { ReportCard } from './ReportCard';
import { GenerateReportDialog } from './GenerateReportDialog';
import { ReportFilterMenu, DEFAULT_REPORT_FILTER, applyReportFilter } from './ReportFilterMenu';
import type { ReportFilter } from './ReportFilterMenu';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import type { AsyncReportDTO } from '../../../types/report';

export function ReportsPage() {
  const { repoId } = useParams<{ repoId: string }>();
  const queryClient = useQueryClient();
  const { reports, isLoading, error } = useReports(repoId ?? '');
  const [filter, setFilter] = useState<ReportFilter>(DEFAULT_REPORT_FILTER);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visibleReports = useMemo(
    () => reports.filter((report) => !removedIds.has(report.id)),
    [reports, removedIds],
  );

  const filteredReports = useMemo(
    () => applyReportFilter(visibleReports, filter),
    [visibleReports, filter],
  );

  const reportTypes = useMemo(
    () => Array.from(new Set(visibleReports.map((report) => report.reportType))),
    [visibleReports],
  );

  function handleDeleted(reportId: string) {
    setRemovedIds((prev) => new Set(prev).add(reportId));
  }

  function handleCreated(_report: AsyncReportDTO) {
    if (repoId) {
      queryClient.invalidateQueries({ queryKey: ['reports', repoId] });
    }
  }

  if (!repoId) {
    return <ErrorState message="No repository selected." />;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Time-bound editorial briefs (async_reports)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <ReportFilterMenu filter={filter} reportTypes={reportTypes} onChange={setFilter} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Generate report
          </Button>
        </Stack>
      </Stack>

      {isLoading && <LoadingSkeleton rows={3} />}
      {error && !isLoading && (
        <ErrorState message="Failed to load reports. Please try again." />
      )}

      {!isLoading && !error && (
        <Grid container spacing={2}>
          {filteredReports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <ReportCard repoId={repoId} report={report} onDeleted={handleDeleted} />
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <CardBase variant="outlined" data-testid="generate-report-card">
              <Card onClick={() => setDialogOpen(true)}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Generate a report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pick a report type and period
                  </Typography>
                </CardContent>
              </Card>
            </CardBase>
          </Grid>
        </Grid>
      )}

      {!isLoading && !error && visibleReports.length === 0 && (
        <EmptyState
          title="No reports yet"
          description="Generate your first editorial brief for this repository."
        />
      )}

      <GenerateReportDialog
        repoId={repoId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  );
}
