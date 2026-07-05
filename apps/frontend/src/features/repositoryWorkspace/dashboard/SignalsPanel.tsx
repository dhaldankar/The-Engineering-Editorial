import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// Static placeholder panel — intentionally performs NO data-fetching in this phase.
//
// architecture.md Section 7 exposes signal_config (rule definitions via signalsService),
// not fired-signal instances outside a specific report; there is no endpoint for "currently
// fired signals" at the repository/dashboard level. Wiring this panel to signalsService would
// silently misrepresent configuration data as live signals, so it stays static until a real
// fired-signals-at-dashboard-level endpoint exists.
export function SignalsPanel() {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Signals
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Signal placeholder — report_signal / signal_config (Section 4.5)
      </Typography>
    </Paper>
  );
}
