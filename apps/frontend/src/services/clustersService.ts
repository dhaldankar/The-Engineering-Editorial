import { apiFetch } from './apiClient';
import type {
  ClusterDTO,
  CreateClusterInput,
  ImportClustersPayload,
  UpdateClusterInput,
} from '../types/cluster';

export function listClusters(repoId: string): Promise<ClusterDTO[]> {
  return apiFetch<ClusterDTO[]>(`/repositories/${repoId}/clusters`);
}

export function createCluster(repoId: string, input: CreateClusterInput): Promise<ClusterDTO> {
  return apiFetch<ClusterDTO>(`/repositories/${repoId}/clusters`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCluster(
  repoId: string,
  clusterId: string,
  patch: UpdateClusterInput,
): Promise<ClusterDTO> {
  return apiFetch<ClusterDTO>(`/repositories/${repoId}/clusters/${clusterId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function recomputeClusters(repoId: string): Promise<void> {
  return apiFetch<void>(`/repositories/${repoId}/clusters/recompute`, { method: 'POST' });
}

export function importClusters(repoId: string, payload: ImportClustersPayload): Promise<void> {
  return apiFetch<void>(`/repositories/${repoId}/clusters/import`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteClusterData(repoId: string): Promise<void> {
  return apiFetch<void>(`/repositories/${repoId}/clusters/data`, { method: 'DELETE' });
}
