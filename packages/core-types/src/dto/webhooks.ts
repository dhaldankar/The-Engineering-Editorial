import { z } from 'zod';

export const GitHubWebhookPayloadSchema = z.object({
  action: z.string(),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string()
  }),
  sender: z.object({
    id: z.number(),
    login: z.string()
  }),
  pull_request: z.any().optional(),
  issue: z.any().optional()
});

export const JiraWebhookPayloadSchema = z.object({
  webhookEvent: z.string(),
  issue_event_type_name: z.string().optional(),
  issue: z.object({
    id: z.string(),
    key: z.string(),
    fields: z.record(z.any())
  })
});

export type GitHubWebhookPayload = z.infer<typeof GitHubWebhookPayloadSchema>;
export type JiraWebhookPayload = z.infer<typeof JiraWebhookPayloadSchema>;
