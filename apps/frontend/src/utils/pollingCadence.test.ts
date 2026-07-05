import { describe, it, expect } from 'vitest';
import { ACTIVE_JOB_INTERVAL_MS, AMBIENT_INTERVAL_MS } from './pollingCadence';

describe('pollingCadence', () => {
  it('active-job cadence is faster than ambient cadence', () => {
    expect(ACTIVE_JOB_INTERVAL_MS).toBeLessThan(AMBIENT_INTERVAL_MS);
  });
});
