import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { SectionErrorBoundary } from '../../../components/SectionErrorBoundary';
import { EmptyState } from '../../../components/EmptyState';
import { MetricStrip } from './MetricStrip';
import { PrimaryViewPanel } from './PrimaryViewPanel';
import { SignalsPanel } from './SignalsPanel';

// "Secondary" is a static placeholder panel reserved for future ambient content
// (Requirement 7.2) — it must not fetch any data in this phase.
function SecondaryPanel() {
  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="secondary-panel">
      <Typography variant="subtitle1" gutterBottom>
        Secondary
      </Typography>
      <EmptyState title="Placeholder card" />
    </Paper>
  );
}

export function DashboardPage() {
  const { repoId } = useParams<{ repoId: string }>();

  if (!repoId) {
    return null;
  }

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <SectionErrorBoundary fallbackMessage="Unable to load metrics for this repository.">
        <MetricStrip repoId={repoId} />
      </SectionErrorBoundary>

      <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
        <Box flex="1 1 auto" minWidth={0}>
          <SectionErrorBoundary fallbackMessage="Unable to load the primary view for this repository.">
            <PrimaryViewPanel repoId={repoId} />
          </SectionErrorBoundary>
        </Box>

        <Box flex="0 0 320px" display="flex" flexDirection="column" gap={2}>
          <SectionErrorBoundary fallbackMessage="Unable to load signals for this repository.">
            <SignalsPanel />
          </SectionErrorBoundary>

          <SecondaryPanel />
        </Box>
      </Box>
    </Box>
  );
}
