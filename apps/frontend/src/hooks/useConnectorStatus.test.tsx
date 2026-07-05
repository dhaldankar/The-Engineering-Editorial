import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConnectorStatus } from './useConnectorStatus';
import * as connectorService from '../services/connectorService';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useConnectorStatus', () => {
  it('reports connected true when at least one source is connected', async () => {
    vi.spyOn(connectorService, 'testConnector').mockImplementation((_scope, source) =>
      Promise.resolve({
        source,
        scope: 'product',
        connected: source === 'github',
        installationOrAccount: null,
        tokenVersion: null,
        lastRotatedAt: null,
        cloudSite: null,
        spaceKey: null,
      }),
    );

    const { result } = renderHook(() => useConnectorStatus('product'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.connected).toBe(true);
  });
});
