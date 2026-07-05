import Grid from '@mui/material/Grid';
import { MetricCard } from '../../components/MetricCard';
import type { ReportKpiDTO } from '../../types/report';

export function ReportKpiStrip({ kpis }: { kpis: ReportKpiDTO[] }) {
  return (
    <Grid container spacing={2}>
      {kpis.map((kpi) => (
        <Grid item xs={12} sm={6} md={3} key={kpi.key}>
          <MetricCard label={kpi.label} value={kpi.value} previousValue={kpi.previousValue} />
        </Grid>
      ))}
    </Grid>
  );
}
