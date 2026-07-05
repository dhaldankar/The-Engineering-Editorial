import { z } from 'zod';

export const SyncRequestSchema = z.object({
  product_id: z.string().uuid(),
  connector_id: z.string().uuid(),
  full_sync: z.boolean().default(false)
});

export const UpdateClusterRequestSchema = z.object({
  name: z.string(),
  repo_id: z.string().uuid()
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type UpdateClusterRequest = z.infer<typeof UpdateClusterRequestSchema>;
