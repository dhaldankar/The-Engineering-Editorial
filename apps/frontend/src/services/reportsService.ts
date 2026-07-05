import { apiFetch } from './apiClient';
import type { AsyncReportDTO, CreateReportInput, ReportDataDTO } from '../types/report';

export function listReports(repoId: string): Promise<AsyncReportDTO[]> {
  return apiFetch<AsyncReportDTO[]>(`/repositories/${repoId}/reports`);
}

export function createReport(repoId: string, input: CreateReportInput): Promise<AsyncReportDTO> {
  return apiFetch<AsyncReportDTO>(`/repositories/${repoId}/reports`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getReport(repoId: string, reportId: string): Promise<AsyncReportDTO> {
  return apiFetch<AsyncReportDTO>(`/repositories/${repoId}/reports/${reportId}`);
}

export function deleteReport(repoId: string, reportId: string): Promise<void> {
  return apiFetch<void>(`/repositories/${repoId}/reports/${reportId}`, { method: 'DELETE' });
}

export function getReportData(repoId: string, reportId: string): Promise<ReportDataDTO> {
  return apiFetch<ReportDataDTO>(`/repositories/${repoId}/reports/${reportId}/data`);
}

export function getReportStatus(repoId: string, reportId: string): Promise<AsyncReportDTO> {
  return apiFetch<AsyncReportDTO>(`/repositories/${repoId}/reports/${reportId}/status`);
}
