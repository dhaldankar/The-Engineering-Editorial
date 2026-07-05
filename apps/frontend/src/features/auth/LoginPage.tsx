import { Authenticator } from '@aws-amplify/ui-react';
import Box from '@mui/material/Box';

export function LoginPage() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Authenticator />
    </Box>
  );
}
