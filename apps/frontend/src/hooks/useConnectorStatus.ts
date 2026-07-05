import { useQuery } from '@tanstack/react-query';
import { testConnector } from '../services/connectorService';
import type { ConnectorScope } from '../types/connector';

export function useConnectorStatus(scope: ConnectorScope, id?: string) {
  const githubQuery = useQuery({
    queryKey: ['connectorStatus', scope, id, 'github'],
    queryFn: () => testConnector(scope, 'github', id),
  });
  const jiraQuery = useQuery({
    queryKey: ['connectorStatus', scope, id, 'jira'],
    queryFn: () => testConnector(scope, 'jira', id),
  });

  const isLoading = githubQuery.isLoading || jiraQuery.isLoading;
  const connected = Boolean(githubQuery.data?.connected || jiraQuery.data?.connected);
  const error = githubQuery.error ?? jiraQuery.error ?? null;

  return { connected, isLoading, error };
}
