import { MetricDefinition, ExecutionContext } from "./types";
import { registry } from "./registry";
import { buildGrainKey } from "./grain";
import { metricFact } from "@engineering-editorial/db-client";
import { sql, SQL } from "drizzle-orm";

export class CircularDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircularDependencyError";
  }
}

export class HarnessEngine {
  private dbClient: any;
  private executionPlan: MetricDefinition[] = [];

  constructor(dbClient: any) {
    this.dbClient = dbClient;
    this.executionPlan = this.sortRegistry(registry);
  }

  private sortRegistry(metrics: MetricDefinition[]): MetricDefinition[] {
    const inDegree: Map<string, number> = new Map();
    const adjList: Map<string, string[]> = new Map();
    const nameToMetric: Map<string, MetricDefinition> = new Map();

    // Initialize maps
    for (const metric of metrics) {
      nameToMetric.set(metric.name, metric);
      inDegree.set(metric.name, 0);
      adjList.set(metric.name, []);
    }

    // Build graph based on reads
    for (const metric of metrics) {
      for (const dependency of metric.reads) {
        // Only track dependencies that are actual metrics in the registry
        if (nameToMetric.has(dependency)) {
          adjList.get(dependency)!.push(metric.name);
          inDegree.set(metric.name, inDegree.get(metric.name)! + 1);
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [name, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    const sorted: MetricDefinition[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(nameToMetric.get(current)!);

      for (const neighbor of adjList.get(current)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (sorted.length !== metrics.length) {
      throw new CircularDependencyError("Circular dependency detected in metric registry");
    }

    return sorted;
  }

  public async runAggregation(repoId: string, runId: string, productId: string) {
    const ctx: ExecutionContext = { productId, repoId, runId };

    for (const metric of this.executionPlan) {
      try {
        const result = await metric.compute(ctx);
        // Note: For actual implementation we'd run result if it's SQL against dbClient
        // For now, assume it returns rows
        const rows: any[] = result instanceof SQL ? await this.dbClient.execute(result) : result;
        
        const factsToInsert = rows.map((row) => {
          // Filter row properties to only include dimensions in metric.grain
          const dimensions: any = {};
          for (const grainKey of metric.grain) {
            if (row[grainKey] !== undefined) {
              dimensions[grainKey] = row[grainKey];
            }
          }

          const grainKey = buildGrainKey(dimensions);

          return {
            productId,
            metricName: metric.name,
            metricVersion: metric.version,
            tier: metric.tier,
            grain: metric.grain.join(','), // Assuming string storage
            repoId: row.repo || null,
            contributorId: row.contributor || null,
            clusterId: row.cluster || null,
            prId: row.pr || null,
            workItemId: row.work_item || null,
            periodStart: row.period || null,
            grainKey,
            valueNum: typeof row.value_num === 'number' ? row.value_num : null,
            valueJson: row.value_json || null,
            runId,
          };
        });

        if (factsToInsert.length > 0) {
          await this.dbClient
            .insert(metricFact)
            .values(factsToInsert)
            .onConflictDoUpdate({
              target: [metricFact.productId, metricFact.metricName, metricFact.metricVersion, metricFact.grainKey],
              set: {
                valueNum: sql`EXCLUDED.value_num`,
                valueJson: sql`EXCLUDED.value_json`,
                runId: sql`EXCLUDED.run_id`,
                computedAt: sql`EXCLUDED.computed_at`,
              }
            });
        }
      } catch (error) {
        console.error(`Error computing metric ${metric.name}:`, error);
        throw error;
      }
    }
  }
}
