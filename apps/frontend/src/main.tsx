import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Amplify } from 'aws-amplify';
import { AppRouter } from './app/AppRouter';
import { theme } from './theme/theme';
import { CurrentProductProvider } from './contexts/CurrentProductContext';
import { RepositoryListProvider } from './contexts/RepositoryListContext';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CurrentProductProvider>
          <RepositoryListProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </RepositoryListProvider>
        </CurrentProductProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
