import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export interface MetricCardProps {
  label: string;
  value: string | number;
  previousValue?: string | number | null;
}

export function MetricCard({ label, value, previousValue }: MetricCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5">{value}</Typography>
        {previousValue !== undefined && previousValue !== null && (
          <Typography variant="caption" color="text.secondary">
            vs prev period: {previousValue}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
