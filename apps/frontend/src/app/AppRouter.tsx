import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { RequireConnector } from './RequireConnector';
import { LoginPage } from '../features/auth/LoginPage';
import { AppShell } from '../features/appShell/AppShell';
import { ConnectorPage } from '../features/onboarding/ConnectorPage';
import { ProjectSettingsLayout } from '../features/projectSettings/ProjectSettingsLayout';
import { MetadataPanel } from '../features/projectSettings/MetadataPanel';
import { JiraConfigurationPanel } from '../features/projectSettings/JiraConfigurationPanel';
import { WorkflowMappingPanel } from '../features/projectSettings/workflowMapping/WorkflowMappingPanel';
import { RepositoryLandingPage } from '../features/repositoryLanding/RepositoryLandingPage';
import { RepositoryWorkspaceLayout } from '../features/repositoryWorkspace/RepositoryWorkspaceLayout';
import { DashboardPage } from '../features/repositoryWorkspace/dashboard/DashboardPage';
import { ReportsPage } from '../features/repositoryWorkspace/reports/ReportsPage';
import { RepositorySettingsLayout } from '../features/repositoryWorkspace/settings/RepositorySettingsLayout';
import { ClustersPanel } from '../features/repositoryWorkspace/settings/clusters/ClustersPanel';
import { ConnectorOverridePanel } from '../features/repositoryWorkspace/settings/connectorOverride/ConnectorOverridePanel';
import { ReportViewerPage } from '../features/reportViewer/ReportViewerPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/repositories" replace />} />
          <Route path="/connector" element={<ConnectorPage />} />
          <Route element={<RequireConnector />}>
            <Route path="/settings" element={<ProjectSettingsLayout />}>
              <Route index element={<Navigate to="metadata" replace />} />
              <Route path="metadata" element={<MetadataPanel />} />
              <Route path="jira-configuration" element={<JiraConfigurationPanel />} />
              <Route path="workflow-mapping" element={<WorkflowMappingPanel />} />
            </Route>
            <Route path="/repositories" element={<RepositoryLandingPage />} />
            <Route path="/repositories/:repoId" element={<RepositoryWorkspaceLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/:reportId" element={<ReportViewerPage />} />
              <Route path="settings" element={<RepositorySettingsLayout />}>
                <Route index element={<Navigate to="clusters" replace />} />
                <Route path="clusters" element={<ClustersPanel />} />
                <Route path="connector-override" element={<ConnectorOverridePanel />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
