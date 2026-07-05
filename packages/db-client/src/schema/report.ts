import { pgSchema, text, integer, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const reportSchema = pgSchema("report");

export const asyncReports = reportSchema.table("async_reports", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  repoId: text("repo_id").notNull(),
  reportType: text("report_type").notNull(),
  period: text("period").notNull(),
  workerVersion: text("worker_version").notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  error: text("error"),
  status: text("status").notNull(),
  stage: text("stage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  reportUnq: uniqueIndex("idx_async_reports_unq").on(
    table.productId, table.repoId, table.reportType, table.period
  )
}));

export const signalConfig = reportSchema.table("signal_config", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  repoId: text("repo_id"),
  name: text("name").notNull(),
  spec: jsonb("spec").notNull(), // names metrics to read, comparison window, threshold rule, severity mapping, narrative template
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportSignal = reportSchema.table("report_signal", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  reportId: text("report_id").notNull().references(() => asyncReports.id),
  signalConfigId: text("signal_config_id").notNull().references(() => signalConfig.id),
  severity: text("severity").notNull(),
  magnitude: integer("magnitude"),
  narrative: text("narrative").notNull(),
  evidence: jsonb("evidence").notNull(), // freezing fact ids and values
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
