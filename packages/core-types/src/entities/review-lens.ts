import { z } from 'zod';

export const BlindspotPatternSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  rules: z.array(z.record(z.any())),
  created_at: z.date(),
  updated_at: z.date()
});

export const ClassificationRuleSchema = z.object({
  id: z.string().uuid(),
  pattern_id: z.string().uuid(),
  condition: z.string(),
  weight: z.number(),
  created_at: z.date(),
  updated_at: z.date()
});

export type BlindspotPattern = z.infer<typeof BlindspotPatternSchema>;
export type ClassificationRule = z.infer<typeof ClassificationRuleSchema>;
