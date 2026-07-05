import type { JobStatus } from './syncRun';

export interface MetricRunDTO {
  id: string;
  repositoryId: string;
  status: JobStatus;
  metricsWritten: number;
  startedAt: string;
  completedAt: string | null;
}
