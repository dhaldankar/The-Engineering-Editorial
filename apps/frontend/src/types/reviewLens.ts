export interface ReviewLensArtifactDTO {
  id: string;
  kind: 'kiro-skill';
  updatedAt: string;
}

export interface ReviewLensStatusDTO {
  status: 'idle' | 'refreshing' | 'error';
  lastRefreshedAt: string | null;
}

export interface ReviewLensTaxonomyDTO {
  categories: Array<{ id: string; name: string }>;
}

export interface ReviewLensRuleDTO {
  id: string;
  archived: boolean;
}
