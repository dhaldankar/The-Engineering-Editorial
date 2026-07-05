import { pgSchema, text, timestamp, uniqueIndex, integer } from "drizzle-orm/pg-core";

export const coreSchema = pgSchema("core");

export const contributors = coreSchema.table("contributors", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatar: text("avatar"),
});

export const contributorIdentities = coreSchema.table("contributor_identities", {
  id: text("id").primaryKey(),
  contributorId: text("contributor_id").notNull().references(() => contributors.id),
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
}, (table) => ({
  identityUnq: uniqueIndex("idx_identities_source_external_unq").on(table.source, table.externalId),
}));

export const contributorIdentityUnresolved = coreSchema.table("contributor_identity_unresolved", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
  reason: text("reason").notNull(),
});

export const workItems = coreSchema.table("work_items", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(), // Tenancy anchor
  repoId: text("repo_id").notNull(),
  key: text("key").notNull(),
  issueType: text("issue_type").notNull(),
  priority: text("priority"),
  assigneeId: text("assignee_id").references(() => contributors.id),
  reporterId: text("reporter_id").references(() => contributors.id),
});

export const workIterations = coreSchema.table("work_iterations", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  workItemId: text("work_item_id").notNull().references(() => workItems.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
});

export const githubPrs = coreSchema.table("github_prs", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  repoId: text("repo_id").notNull(),
  number: integer("number").notNull(),
  workItemId: text("work_item_id").references(() => workItems.id),
  iterationId: text("iteration_id").references(() => workIterations.id),
  authorId: text("author_id").references(() => contributors.id),
});

export const prFiles = coreSchema.table("pr_files", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  prId: text("pr_id").notNull().references(() => githubPrs.id),
  path: text("path").notNull(),
  additions: integer("additions").notNull(),
  deletions: integer("deletions").notNull(),
});

export const reviews = coreSchema.table("reviews", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  prId: text("pr_id").notNull().references(() => githubPrs.id),
  reviewerId: text("reviewer_id").references(() => contributors.id),
  tone: text("tone"),
  feedbackAspect: text("feedback_aspect"),
});

export const reviewComments = coreSchema.table("review_comments", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  reviewId: text("review_id").notNull().references(() => reviews.id),
  prFileId: text("pr_file_id").references(() => prFiles.id),
  tone: text("tone"),
  changeType: text("change_type"),
  path: text("path").notNull(), // raw origin string
});

export const codeClusters = coreSchema.table("code_clusters", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  repoId: text("repo_id").notNull(),
  name: text("name").notNull(),
  curationStatus: text("curation_status").notNull(), // auto/confirmed/renamed/manual/archived
});

export const clusterAssignments = coreSchema.table("cluster_assignments", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  clusterId: text("cluster_id").notNull().references(() => codeClusters.id),
  fileId: text("file_id").notNull().references(() => prFiles.id),
});
