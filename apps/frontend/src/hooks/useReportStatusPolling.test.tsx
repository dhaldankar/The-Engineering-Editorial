import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReportStatusPolling } from './useReportStatusPolling';
import * as reportsService from '../services/reportsService';

describe('useReportStatusPolling', () => {
  it('de-duplicates two simultaneously mounted consumers of the same reportId', async () => {
    const spy = vi.spyOn(reportsService, 'getReportStatus').mockResolvedValue({
      id: 'r1',
      repositoryId: 'repo-1',
      reportType: 'weekly',
      period: '2026-W06',
      periodStart: '2026-02-02',
      periodEnd: '2026-02-08',
      status: 'completed',
      stage: null,
      progress: 100,
      signalCount: 3,
      retryCount: 0,
      errorMessage: null,
      generatedAt: '2026-02-08T00:00:00Z',
    });

    const client = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useReportStatusPolling('repo-1', 'r1'), { wrapper: Wrapper });
    const { result } = renderHook(() => useReportStatusPolling('repo-1', 'r1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe('completed'));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
