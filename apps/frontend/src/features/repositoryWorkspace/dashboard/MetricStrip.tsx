import Box from '@mui/material/Box';
import { useRepositoryStats } from '../../../hooks/useRepositoryStats';
import { MetricCard } from '../../../components/MetricCard';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export interface MetricStripProps {
  repoId: string;
}

export function MetricStrip({ repoId }: MetricStripProps) {
  const { stats, isLoading, error } = useRepositoryStats(repoId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message="Unable to load metrics for this repository." />;
  }

  if (!stats || !stats.hasFacts || stats.metrics.length === 0) {
    return (
      <EmptyState
        title="No metrics yet"
        description="Metrics will appear here once the first sync and aggregation complete."
      />
    );
  }

  return (
    <Box display="flex" gap={2} flexWrap="wrap">
      {stats.metrics.map((metric) => (
        <MetricCard
          key={metric.key}
          label={metric.label}
          value={metric.value}
          previousValue={metric.previousValue}
        />
      ))}
    </Box>
  );
}
