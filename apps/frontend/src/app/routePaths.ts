export const routePaths = {
  login: () => '/login',
  connector: () => '/connector',
  settings: () => '/settings',
  settingsMetadata: () => '/settings/metadata',
  settingsJiraConfiguration: () => '/settings/jira-configuration',
  settingsWorkflowMapping: () => '/settings/workflow-mapping',
  repositories: () => '/repositories',
  repositoryDashboard: (repoId: string) => `/repositories/${repoId}/dashboard`,
  repositoryReports: (repoId: string) => `/repositories/${repoId}/reports`,
  reportViewer: (repoId: string, reportId: string) =>
    `/repositories/${repoId}/reports/${reportId}`,
  repositorySettings: (repoId: string) => `/repositories/${repoId}/settings`,
  repositorySettingsClusters: (repoId: string) => `/repositories/${repoId}/settings/clusters`,
  repositorySettingsConnectorOverride: (repoId: string) =>
    `/repositories/${repoId}/settings/connector-override`,
};
