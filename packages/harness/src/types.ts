import { SQL } from "drizzle-orm";

export type GrainDimension = 'repo' | 'contributor' | 'cluster' | 'pr' | 'work_item' | 'period';

export interface ExecutionContext {
  // Context passed into a metric's compute function
  productId: string;
  repoId: string;
  runId: string;
}

export interface MetricDefinition {
  name: string;
  version: number;
  tier: 'aggregate' | 'analytical';
  grain: GrainDimension[];
  reads: string[];
  compute: (ctx: ExecutionContext) => Promise<SQL | any[]>; // SQL template or raw results
}

export function defineMetric(def: MetricDefinition): MetricDefinition {
  return def;
}
