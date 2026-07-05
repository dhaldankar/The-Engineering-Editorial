import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useRepositoryStats } from '../../../hooks/useRepositoryStats';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export interface PrimaryViewPanelProps {
  repoId: string;
}

// Visualization placeholder — reads Gold facts (metric_fact) per repository-dashboard.md's
// "Primary View" section. The chart/table itself is out of scope for this phase; this panel
// only distinguishes loading / error / no-facts-yet / has-facts states.
export function PrimaryViewPanel({ repoId }: PrimaryViewPanelProps) {
  const { stats, isLoading, error } = useRepositoryStats(repoId);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Primary View
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Visualization placeholder — reads Gold facts (metric_fact)
      </Typography>
      {isLoading && <LoadingSkeleton rows={4} height={48} />}
      {!isLoading && error && (
        <ErrorState message="Unable to load the primary view for this repository." />
      )}
      {!isLoading && !error && (!stats || !stats.hasFacts) && (
        <EmptyState
          title="No data to visualize yet"
          description="The chart/table will render here once facts are available."
        />
      )}
      {!isLoading && !error && stats && stats.hasFacts && (
        <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Chart / table goes here
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
