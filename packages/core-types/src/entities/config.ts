import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

export const RepositorySchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  created_at: z.date(),
  updated_at: z.date()
});

export const DataConnectorSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  type: z.enum(['github', 'jira', 'linear']),
  config: z.record(z.any()),
  created_at: z.date(),
  updated_at: z.date()
});

export const WorkflowStatusMappingSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  external_status: z.string(),
  internal_phase: z.string(),
  created_at: z.date(),
  updated_at: z.date()
});

export type Product = z.infer<typeof ProductSchema>;
export type Repository = z.infer<typeof RepositorySchema>;
export type DataConnector = z.infer<typeof DataConnectorSchema>;
export type WorkflowStatusMapping = z.infer<typeof WorkflowStatusMappingSchema>;
