import { pgSchema, text, timestamp, uniqueIndex, integer } from "drizzle-orm/pg-core";

export const configSchema = pgSchema("config");

export const products = configSchema.table("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const repositories = configSchema.table("repositories", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  key: text("key").notNull(),
  displayName: text("display_name").notNull(),
  status: text("status").notNull(),
  githubOwner: text("github_owner"),
  githubRepo: text("github_repo"),
  jiraProjectKey: text("jira_project_key"),
  ticketKeyPattern: text("ticket_key_pattern"),
}, (table) => ({
  repoUnq: uniqueIndex("idx_repo_product_key_unq").on(table.productId, table.key),
}));

export const accounts = configSchema.table("accounts", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  contributorId: text("contributor_id"), // Will reference core.contributors.id
});

export const dataConnectors = configSchema.table("data_connectors", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  repositoryId: text("repository_id").references(() => repositories.id),
  connectorType: text("connector_type").notNull(), // 'github' | 'jira'
  credentialsCiphertext: text("credentials_ciphertext").notNull(),
  keyVersion: integer("key_version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowStatusMappings = configSchema.table("workflow_status_mappings", {
  id: text("id").primaryKey(),
  repoId: text("repo_id").notNull().references(() => repositories.id),
  jiraStatus: text("jira_status").notNull(),
  phase: text("phase").notNull(), // backlog -> ready -> in_dev -> str -> qa -> done
}, (table) => ({
  workflowUnq: uniqueIndex("idx_workflow_repo_status_unq").on(table.repoId, table.jiraStatus),
}));
