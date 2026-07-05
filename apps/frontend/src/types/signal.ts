export type SignalSeverity = 'low' | 'medium' | 'high';

export interface ReportSignalDTO {
  id: string;
  reportId: string;
  headline: string;
  severity: SignalSeverity;
  narrative: string;
  evidence: Record<string, unknown>;
}

export interface SignalConfigDTO {
  key: string;
  enabled: boolean;
  threshold: number | null;
}
