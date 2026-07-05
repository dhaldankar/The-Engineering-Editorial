import { z } from 'zod';
import { MetricFactSchema } from '../entities/facts';

export const ApiResponseEnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional()
});

export const MetricFactResponseSchema = ApiResponseEnvelopeSchema.extend({
  data: z.array(MetricFactSchema)
});

export const DashboardResponseSchema = ApiResponseEnvelopeSchema.extend({
  data: z.object({
    metrics: z.array(MetricFactSchema),
    summary: z.record(z.any())
  })
});

export type ApiResponseEnvelope = z.infer<typeof ApiResponseEnvelopeSchema>;
export type MetricFactResponse = z.infer<typeof MetricFactResponseSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
