import { apiFetch } from './apiClient';
import type { ContributorDTO, MergeContributorsInput } from '../types/contributor';

// Typed stubs only: no wireframed screen in this phase consumes contributor data.
export function listContributors(repoId: string): Promise<ContributorDTO[]> {
  return apiFetch<ContributorDTO[]>(`/repositories/${repoId}/contributors`);
}

export function listUnresolvedContributors(repoId: string): Promise<ContributorDTO[]> {
  return apiFetch<ContributorDTO[]>(`/repositories/${repoId}/contributors/unresolved`);
}

export function getContributor(id: string): Promise<ContributorDTO> {
  return apiFetch<ContributorDTO>(`/contributors/${id}`);
}

export function mergeContributors(input: MergeContributorsInput): Promise<ContributorDTO> {
  return apiFetch<ContributorDTO>('/contributors/merge', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
