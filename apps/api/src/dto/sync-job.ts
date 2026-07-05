import { z } from "zod";

export const SyncJobRequestSchema = z.object({
  repoId: z.string().min(1),
  fullSync: z.boolean().default(false),
});

export type SyncJobRequest = z.infer<typeof SyncJobRequestSchema>;

export const SyncJobResponseSchema = z.object({
  jobId: z.string(),
  status: z.string(),
});

export type SyncJobResponse = z.infer<typeof SyncJobResponseSchema>;
