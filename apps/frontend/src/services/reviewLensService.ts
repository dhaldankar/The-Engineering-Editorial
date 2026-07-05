import { apiFetch } from './apiClient';
import type {
  ReviewLensArtifactDTO,
  ReviewLensRuleDTO,
  ReviewLensStatusDTO,
  ReviewLensTaxonomyDTO,
} from '../types/reviewLens';

// Typed stubs only: no wireframed screen in this phase consumes review lens data.
export function getKiroSkillArtifact(repoId: string): Promise<ReviewLensArtifactDTO> {
  return apiFetch<ReviewLensArtifactDTO>(`/repositories/${repoId}/artifacts/kiro-skill`);
}

export function refreshReviewLens(repoId: string): Promise<ReviewLensStatusDTO> {
  return apiFetch<ReviewLensStatusDTO>(`/repositories/${repoId}/review-lens/refresh`, {
    method: 'POST',
  });
}

export function getReviewLensStatus(repoId: string): Promise<ReviewLensStatusDTO> {
  return apiFetch<ReviewLensStatusDTO>(`/repositories/${repoId}/review-lens/status`);
}

export function getReviewLensTaxonomy(repoId: string): Promise<ReviewLensTaxonomyDTO> {
  return apiFetch<ReviewLensTaxonomyDTO>(`/repositories/${repoId}/review-lens/taxonomy`);
}

export function rediscoverTaxonomy(repoId: string): Promise<ReviewLensTaxonomyDTO> {
  return apiFetch<ReviewLensTaxonomyDTO>(`/repositories/${repoId}/review-lens/taxonomy/rediscover`, {
    method: 'POST',
  });
}

export function archiveReviewLensRule(repoId: string, ruleId: string): Promise<ReviewLensRuleDTO> {
  return apiFetch<ReviewLensRuleDTO>(`/repositories/${repoId}/review-lens/rules/${ruleId}/archive`, {
    method: 'POST',
  });
}
