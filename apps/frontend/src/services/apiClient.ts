import { fetchAuthSession } from 'aws-amplify/auth';

export class ApiError extends Error {
  status: number;
  code: string;
  body: unknown;

  constructor(status: number, code: string, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL as string;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // No session available; request proceeds unauthenticated and the API will 401.
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, { ...init, headers });
  } catch (networkError) {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      null,
      networkError instanceof Error ? networkError.message : 'Network request failed',
    );
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // No JSON body to parse.
    }
    throw new ApiError(
      response.status,
      typeof body === 'object' && body !== null && 'code' in body
        ? String((body as { code: unknown }).code)
        : 'HTTP_ERROR',
      body,
      `Request to ${path} failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
