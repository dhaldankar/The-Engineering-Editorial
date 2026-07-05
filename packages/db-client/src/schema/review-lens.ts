import { pgSchema, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const reviewLensSchema = pgSchema("review_lens");

export const projectClassificationTaxonomy = reviewLensSchema.table("project_classification_taxonomy", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  repoId: text("repo_id").notNull(),
  version: text("version").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  categories: jsonb("categories").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const factReviewCommentClassification = reviewLensSchema.table("fact_review_comment_classification", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  commentId: text("comment_id").notNull(),
  taxonomyId: text("taxonomy_id").notNull().references(() => projectClassificationTaxonomy.id),
  category: text("category").notNull(),
  actionability: text("actionability").notNull(),
  severity: text("severity").notNull(),
  isAddressed: boolean("is_addressed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const factClusterBlindspotPattern = reviewLensSchema.table("fact_cluster_blindspot_pattern", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  clusterId: text("cluster_id").notNull(),
  categoryId: text("category_id").notNull(),
  exemplarComments: jsonb("exemplar_comments").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const factClusterBlindspotRule = reviewLensSchema.table("fact_cluster_blindspot_rule", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  clusterId: text("cluster_id").notNull(),
  patternId: text("pattern_id").notNull().references(() => factClusterBlindspotPattern.id),
  trigger: text("trigger").notNull(),
  detectionCue: text("detection_cue").notNull(),
  fixPrescription: text("fix_prescription").notNull(),
  confidence: text("confidence").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
