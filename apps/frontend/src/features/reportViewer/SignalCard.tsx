import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { StatusChip } from '../../components/StatusChip';
import type { ReportSignalDTO, SignalSeverity } from '../../types/signal';
import type { StatusKind } from '../../theme/statusColors';

const SEVERITY_KIND: Record<SignalSeverity, StatusKind> = {
  high: 'danger',
  medium: 'warning',
  low: 'research',
};

const SEVERITY_LABEL: Record<SignalSeverity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// Evidence is rendered exactly as received — frozen fact ids/values recorded
// at generation time, never recomputed client-side (Requirement 9.2).
export function SignalCard({ signal }: { signal: ReportSignalDTO }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {signal.headline}
          </Typography>
          <StatusChip label={SEVERITY_LABEL[signal.severity]} kind={SEVERITY_KIND[signal.severity]} />
        </Box>
        <Typography variant="body2" mb={2}>
          {signal.narrative}
        </Typography>
        <Box bgcolor="action.hover" borderRadius={1} p={1.5}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Evidence
          </Typography>
          {Object.entries(signal.evidence).map(([key, value]) => (
            <Typography key={key} variant="body2" component="div">
              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
