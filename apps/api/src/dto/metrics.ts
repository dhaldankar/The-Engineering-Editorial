import { z } from "zod";

export const DashboardMetricResponseSchema = z.object({
  metricName: z.string(),
  value: z.number().nullable(),
  trend: z.number().nullable().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

export type DashboardMetricResponse = z.infer<typeof DashboardMetricResponseSchema>;

export const DashboardOverviewResponseSchema = z.object({
  metrics: z.array(DashboardMetricResponseSchema),
});

export type DashboardOverviewResponse = z.infer<typeof DashboardOverviewResponseSchema>;
