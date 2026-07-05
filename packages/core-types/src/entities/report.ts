import { z } from 'zod';

export const SignalConfigSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  thresholds: z.record(z.any()),
  created_at: z.date(),
  updated_at: z.date()
});

export const AsyncReportSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  generated_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

export const ReportSignalSchema = z.object({
  id: z.string().uuid(),
  report_id: z.string().uuid(),
  signal_config_id: z.string().uuid(),
  value: z.number(),
  metadata: z.record(z.any()).nullable(),
  created_at: z.date()
});

export type SignalConfig = z.infer<typeof SignalConfigSchema>;
export type AsyncReport = z.infer<typeof AsyncReportSchema>;
export type ReportSignal = z.infer<typeof ReportSignalSchema>;
