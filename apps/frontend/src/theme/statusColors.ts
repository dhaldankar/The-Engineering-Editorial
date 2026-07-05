export type StatusKind = 'success' | 'warning' | 'danger' | 'research';

const STATUS_COLOR_MAP: Record<StatusKind, string> = {
  success: '#2e7d32',
  warning: '#ed6c02',
  danger: '#d32f2f',
  research: '#0288d1',
};

export function getStatusColor(kind: StatusKind): string {
  return STATUS_COLOR_MAP[kind];
}
