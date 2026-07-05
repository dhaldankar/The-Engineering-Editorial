import { apiFetch } from './apiClient';
import type { CreateRepositoryInput, RepositoryDTO, RepositoryStatsDTO } from '../types/repository';

export function listRepositories(): Promise<RepositoryDTO[]> {
  return apiFetch<RepositoryDTO[]>('/repositories');
}

export function getRepository(id: string): Promise<RepositoryDTO> {
  return apiFetch<RepositoryDTO>(`/repositories/${id}`);
}

export function createRepository(input: CreateRepositoryInput): Promise<RepositoryDTO> {
  return apiFetch<RepositoryDTO>('/repositories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateRepository(
  id: string,
  patch: Partial<CreateRepositoryInput>,
): Promise<RepositoryDTO> {
  return apiFetch<RepositoryDTO>(`/repositories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteRepository(id: string): Promise<void> {
  return apiFetch<void>(`/repositories/${id}`, { method: 'DELETE' });
}

export function getRepositoryStats(id: string): Promise<RepositoryStatsDTO> {
  return apiFetch<RepositoryStatsDTO>(`/repositories/${id}/stats`);
}
