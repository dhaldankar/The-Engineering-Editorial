export type ConnectorSource = 'github' | 'jira';
export type ConnectorScope = 'product' | 'repository';

export interface ConnectorDTO {
  source: ConnectorSource;
  scope: ConnectorScope;
  connected: boolean;
  installationOrAccount: string | null;
  tokenVersion: number | null;
  lastRotatedAt: string | null;
  cloudSite: string | null;
  spaceKey: string | null;
  isOverride?: boolean;
}

export interface PutConnectorInput {
  code?: string;
  state?: string;
}
