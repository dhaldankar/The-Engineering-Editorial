export interface ContributorDTO {
  id: string;
  displayName: string;
  githubLogin: string | null;
  jiraAccountId: string | null;
  resolved: boolean;
}

export interface MergeContributorsInput {
  primaryId: string;
  mergedIds: string[];
}
