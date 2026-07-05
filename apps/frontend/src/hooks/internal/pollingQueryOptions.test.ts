import { describe, it, expect } from 'vitest';
import { createPollingQueryOptions } from './pollingQueryOptions';

interface Job {
  status: string;
}

describe('createPollingQueryOptions', () => {
  const base = {
    getStatus: (data: Job) => data.status,
    terminalStatuses: ['completed', 'failed'],
    intervalMs: 5000,
  };

  it('returns false once data reaches a terminal status', () => {
    const options = createPollingQueryOptions({ ...base, isVisible: true });
    const result = options.refetchInterval({ state: { data: { status: 'completed' } } });
    expect(result).toBe(false);
  });

  it('returns the configured interval while non-terminal and visible', () => {
    const options = createPollingQueryOptions({ ...base, isVisible: true });
    const result = options.refetchInterval({ state: { data: { status: 'running' } } });
    expect(result).toBe(5000);
  });

  it('returns false while the page is hidden', () => {
    const options = createPollingQueryOptions({ ...base, isVisible: false });
    const result = options.refetchInterval({ state: { data: { status: 'running' } } });
    expect(result).toBe(false);
  });
});
