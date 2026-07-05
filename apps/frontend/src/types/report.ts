export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface AsyncReportDTO {
  id: string;
  repositoryId: string;
  reportType: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  stage: string | null;
  progress: number | null;
  signalCount: number | null;
  retryCount: number;
  errorMessage: string | null;
  generatedAt: string | null;
}

export interface CreateReportInput {
  reportType: string;
  period: string;
}

export interface ReportKpiDTO {
  key: string;
  label: string;
  value: number;
  previousValue: number | null;
}

export interface ReportDataDTO {
  kpis: ReportKpiDTO[];
  signals: import('./signal').ReportSignalDTO[];
}
