export type RepositoryStatus = 'onboarding' | 'syncing' | 'synced' | 'error';

export interface RepositoryDTO {
  id: string;
  key: string;
  displayName: string;
  status: RepositoryStatus;
  githubOwner: string;
  githubRepo: string;
  jiraProjectKey: string;
  ticketKeyPattern: string;
  lastSyncedAt: string | null;
}

export interface CreateRepositoryInput {
  key: string;
  displayName: string;
  githubOwner: string;
  githubRepo: string;
  jiraProjectKey: string;
  ticketKeyPattern: string;
}

export interface RepositoryStatsDTO {
  metrics: Array<{ key: string; label: string; value: number; previousValue: number | null }>;
  hasFacts: boolean;
  metricRun?: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    metricsWritten: number;
    startedAt: string;
    completedAt: string | null;
  };
}
