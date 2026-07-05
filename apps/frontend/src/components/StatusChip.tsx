import Chip from '@mui/material/Chip';
import { getStatusColor, type StatusKind } from '../theme/statusColors';

export interface StatusChipProps {
  label: string;
  kind: StatusKind;
}

export function StatusChip({ label, kind }: StatusChipProps) {
  const color = getStatusColor(kind);
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        color,
        borderColor: color,
        backgroundColor: `${color}1a`,
      }}
      variant="outlined"
    />
  );
}
