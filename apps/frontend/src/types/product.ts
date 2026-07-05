export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  jiraCloudSite: string | null;
  jiraSpaceKey: string | null;
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
}
