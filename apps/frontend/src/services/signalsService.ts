import { apiFetch } from './apiClient';
import type { SignalConfigDTO } from '../types/signal';

export function getSignals(repoId: string): Promise<SignalConfigDTO[]> {
  return apiFetch<SignalConfigDTO[]>(`/repositories/${repoId}/signals`);
}

export function putSignals(repoId: string, config: SignalConfigDTO[]): Promise<SignalConfigDTO[]> {
  return apiFetch<SignalConfigDTO[]>(`/repositories/${repoId}/signals`, {
    method: 'PUT',
    body: JSON.stringify({ signals: config }),
  });
}
