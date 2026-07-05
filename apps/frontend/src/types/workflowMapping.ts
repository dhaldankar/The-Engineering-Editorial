export type CanonicalPhase = 'backlog' | 'ready' | 'in_dev' | 'str' | 'qa' | 'done';

export interface WorkflowMappingDTO {
  jiraStatus: string;
  phase: CanonicalPhase | null;
  inferred: boolean;
  confirmed: boolean;
}

export type WorkflowMappingPatch = Array<{ jiraStatus: string; phase: CanonicalPhase | null }>;
