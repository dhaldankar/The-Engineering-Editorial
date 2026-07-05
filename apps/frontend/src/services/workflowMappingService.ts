import { apiFetch } from './apiClient';
import type { WorkflowMappingDTO, WorkflowMappingPatch } from '../types/workflowMapping';

export function getMappings(): Promise<WorkflowMappingDTO[]> {
  return apiFetch<WorkflowMappingDTO[]>('/products/current/workflow-mappings');
}

export function putMappings(mappings: WorkflowMappingPatch): Promise<WorkflowMappingDTO[]> {
  return apiFetch<WorkflowMappingDTO[]>('/products/current/workflow-mappings', {
    method: 'PUT',
    body: JSON.stringify({ mappings }),
  });
}

export function inferMappings(): Promise<WorkflowMappingDTO[]> {
  return apiFetch<WorkflowMappingDTO[]>('/products/current/workflow-mappings/infer', {
    method: 'POST',
  });
}

export function getStatuses(): Promise<string[]> {
  return apiFetch<string[]>('/products/current/workflow-mappings/statuses');
}
