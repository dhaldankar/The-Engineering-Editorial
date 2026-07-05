export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SyncRunDTO {
  id: string;
  repositoryId: string;
  status: JobStatus;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}
