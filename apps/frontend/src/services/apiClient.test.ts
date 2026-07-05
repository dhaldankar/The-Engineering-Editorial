import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError } from './apiClient';

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

import { fetchAuthSession } from 'aws-amplify/auth';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: { idToken: { toString: () => 'test-token' } },
    } as unknown as Awaited<ReturnType<typeof fetchAuthSession>>);
  });

  it('attaches the Authorization header and returns parsed JSON on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const result = await apiFetch<{ ok: boolean }>('/products/current');

    expect(result).toEqual({ ok: true });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Headers).get('Authorization')).toBe('Bearer test-token');
  });

  it('throws ApiError with status/body on a 4xx/5xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'CONFLICT', message: 'dup' }), { status: 409 }),
    );

    await expect(apiFetch('/repositories')).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
  });

  it('throws ApiError{status:401} on an unauthorized response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));

    await expect(apiFetch('/products/current')).rejects.toMatchObject({ status: 401 });
  });

  it('throws ApiError with status 0 / NETWORK_ERROR on a rejected fetch', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    const error = (await apiFetch('/products/current').catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe('NETWORK_ERROR');
  });
});
