import { apiFetch } from './apiClient';
import type { ConnectorDTO, ConnectorScope, ConnectorSource, PutConnectorInput } from '../types/connector';

function basePath(scope: ConnectorScope, id?: string): string {
  return scope === 'product' ? '/products/current' : `/repositories/${id}`;
}

export function getConnector(
  scope: ConnectorScope,
  source: ConnectorSource,
  id?: string,
): Promise<ConnectorDTO> {
  return apiFetch<ConnectorDTO>(`${basePath(scope, id)}/connector/${source}`);
}

export function putConnector(
  scope: ConnectorScope,
  source: ConnectorSource,
  input: PutConnectorInput,
  id?: string,
): Promise<ConnectorDTO> {
  return apiFetch<ConnectorDTO>(`${basePath(scope, id)}/connector/${source}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function testConnector(
  scope: ConnectorScope,
  source: ConnectorSource,
  id?: string,
): Promise<ConnectorDTO> {
  return apiFetch<ConnectorDTO>(`${basePath(scope, id)}/connector/${source}/test`, {
    method: 'POST',
  });
}

export function deleteConnector(
  scope: ConnectorScope,
  source: ConnectorSource,
  id?: string,
): Promise<void> {
  return apiFetch<void>(`${basePath(scope, id)}/connector/${source}`, { method: 'DELETE' });
}
