import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

export interface ErrorStateProps {
  message: string;
  variant?: 'network' | 'server';
  action?: React.ReactNode;
}

export function ErrorState({ message, variant = 'server', action }: ErrorStateProps) {
  return (
    <Box py={2}>
      <Alert severity={variant === 'network' ? 'warning' : 'error'}>{message}</Alert>
      {action && <Box mt={1}>{action}</Box>}
    </Box>
  );
}
