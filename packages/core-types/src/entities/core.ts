import { z } from 'zod';
import { LifecyclePhaseEnum } from '../enums/lifecycle';

export const ContributorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  aliases: z.array(z.string()).default([]),
  created_at: z.date(),
  updated_at: z.date()
});

export const WorkItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  phase: LifecyclePhaseEnum,
  assignee_id: z.string().uuid().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

export const GitHubPRSchema = z.object({
  id: z.string().uuid(),
  repo_id: z.string().uuid(),
  number: z.number(),
  title: z.string(),
  state: z.string(),
  author_id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date()
});

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  pr_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  state: z.string(),
  created_at: z.date(),
  updated_at: z.date()
});

export const CodeClusterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  repo_id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date()
});

export type Contributor = z.infer<typeof ContributorSchema>;
export type WorkItem = z.infer<typeof WorkItemSchema>;
export type GitHubPR = z.infer<typeof GitHubPRSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type CodeCluster = z.infer<typeof CodeClusterSchema>;
