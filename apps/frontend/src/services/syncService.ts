import { apiFetch } from './apiClient';
import type { SyncRunDTO } from '../types/syncRun';

export function getSyncRuns(repoId: string): Promise<SyncRunDTO[]> {
  return apiFetch<SyncRunDTO[]>(`/repositories/${repoId}/sync/runs`);
}

export function getSyncRun(repoId: string, runId: string): Promise<SyncRunDTO> {
  return apiFetch<SyncRunDTO>(`/repositories/${repoId}/sync/runs/${runId}`);
}

export function triggerSync(repoId: string): Promise<SyncRunDTO> {
  return apiFetch<SyncRunDTO>(`/repositories/${repoId}/sync`, { method: 'POST' });
}
