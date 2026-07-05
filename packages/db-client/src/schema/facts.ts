import { pgSchema, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const factsSchema = pgSchema("facts");

export const metricFact = factsSchema.table("metric_fact", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  metricName: text("metric_name").notNull(),
  metricVersion: integer("metric_version").notNull(),
  tier: text("tier").notNull(),
  grain: text("grain").notNull(),
  repoId: text("repo_id"),
  contributorId: text("contributor_id"),
  clusterId: text("cluster_id"),
  prId: text("pr_id"),
  workItemId: text("work_item_id"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  grainKey: text("grain_key").notNull(),
  valueNum: integer("value_num"),
  valueJson: jsonb("value_json"),
  valueType: text("value_type"),
  runId: text("run_id"),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
}, (table) => ({
  factUnq: uniqueIndex("idx_metric_fact_unq").on(
    table.productId, table.metricName, table.metricVersion, table.grainKey
  )
}));

export const metricRun = factsSchema.table("metric_run", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  repoId: text("repo_id").notNull(),
  runId: text("run_id").notNull(),
  status: text("status").notNull(),
  factsWritten: integer("facts_written"),
  error: text("error"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
});
