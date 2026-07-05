import { z } from 'zod';
import { GrainEnum } from '../enums/grains';

export const MetricFactSchema = z.object({
  product_id: z.string().uuid(),
  metric_name: z.string(),
  metric_version: z.number(),
  tier: z.enum(['aggregate', 'analytical']),
  grain: GrainEnum,
  
  // Nullable dimensional FKs
  repo_id: z.string().uuid().nullable(),
  contributor_id: z.string().uuid().nullable(),
  cluster_id: z.string().uuid().nullable(),
  pr_id: z.string().uuid().nullable(),
  work_item_id: z.string().uuid().nullable(),
  period_start: z.date().nullable(),
  period_end: z.date().nullable(),
  
  // Values
  value_num: z.number().nullable(),
  value_json: z.record(z.any()).nullable(),
  
  // Provenance
  grain_key: z.string(),
  run_id: z.string().uuid(),
  computed_at: z.date()
});

export type MetricFact = z.infer<typeof MetricFactSchema>;
