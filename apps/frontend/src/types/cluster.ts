export type ClusterCurationStatus = 'auto' | 'confirmed' | 'renamed' | 'manual' | 'archived';

export interface ClusterDTO {
  id: string;
  name: string;
  filePattern: string;
  curationStatus: ClusterCurationStatus;
  fileCount: number;
}

export interface CreateClusterInput {
  name: string;
  filePattern: string;
}

export type UpdateClusterInput = Partial<CreateClusterInput>;

export interface ImportClustersPayload {
  clusters: Array<{ name: string; filePattern: string }>;
}
