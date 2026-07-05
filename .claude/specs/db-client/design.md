# Design Document

## Overview

The `packages/db-client` is a dedicated TypeScript module inside the monorepo that encapsulates all database interactions for the Engineering Insights platform. It is powered by **Drizzle ORM**, providing a type-safe interface over Amazon Aurora Serverless v2 PostgreSQL.

## Steering Document Alignment

### Technical Standards (tech.md)
This design strictly implements the constraints defined in `architecture.md`:
- **Serverless Connections:** Drizzle connects via `postgres.js` over RDS Proxy for heavy asynchronous pipelines, and via `@aws-sdk/client-rds-data` (Data API) for lightweight API Lambdas.
- **Data Architecture (Medallion):** It defines the exact table structures for the Silver (`core`) and Gold (`facts`) tiers across five strict schemas.

### Project Structure (structure.md)
The package is isolated. It does not depend on `apps/api` or `apps/workers`. Those applications consume the `db-client` to perform database work.

## Code Reuse Analysis

### Existing Components to Leverage
- **`packages/core-types`**: While Drizzle generates its own types, complex JSON structures (like `report_signal.evidence` and `metric_fact.value_json`) will import type interfaces from `core-types` and cast them in the schema.

### Integration Points
- **Drizzle Kit**: Used for generating SQL migrations and pushing schema changes.
- **AWS RDS Proxy**: Target endpoint for the connection pool.

## Architecture

The `db-client` package is strictly separated into Schema definitions, the Client Factory, and Tenancy Wrappers.

### Modular Design Principles
- **Schema Separation**: Each of the 5 namespaces (`config`, `core`, `facts`, `report`, `review-lens`) gets its own directory/file inside `src/schema/`.
- **Client Factory**: A centralized `index.ts` encapsulates the connection transport choice, returning a unified Drizzle instance regardless of whether the transport is RDS Proxy or Data API.
- **Migration Isolation**: `drizzle-kit` configuration is kept at the package root. Migrations are compiled and stored in `migrations/`.

```mermaid
graph TD
    A[Consumer: API / Worker] --> B[DbClient Factory (index.ts)]
    B --> C{Transport Mode}
    C -->|Proxy| D[postgres.js Driver]
    C -->|Data API| E[RDS Data API Driver]
    D --> F[(Aurora Postgres)]
    E --> F
    
    G[Tenancy Wrapper] -.-> B
    G --> H[Enforces product_id filter]
```

## Components and Interfaces

### DbClient Factory (`src/index.ts`)
- **Purpose:** Initializes and returns the Drizzle ORM instance. Acts as the pool initialization boundary.
- **Interfaces:** `export function createClient(config: DbConfig): DrizzleClient`
- **Dependencies:** `drizzle-orm/postgres-js`, `drizzle-orm/aws-data-api-pg`

### Runtime Migrator (`src/migrator.ts`)
- **Purpose:** Exposes a runtime script executed by a custom CoreStack Lambda to apply migrations on deployment.
- **Interfaces:** `export const handler = async (event) => { ... }`
- **Dependencies:** `drizzle-orm/postgres-js/migrator`

### Tenancy Enforcer (Wrapper)
- **Purpose:** A middleware/utility function that wraps Drizzle queries to guarantee `product_id` is appended to `WHERE` clauses.
- **Interfaces:** `withTenant(db, productId)`
- **Dependencies:** Drizzle query builder.

### Schema Exports
- **Purpose:** Exposes table objects for consumers to construct queries.
- **Interfaces:** `export * from './schema'` (combines config, core, facts, report, review_lens).
- **Reuses:** JSON payloads leverage `core-types`.

## Data Models (Drizzle Schemas)

### The `facts.metric_fact` Table (Idempotency Backbone)
```typescript
import { pgSchema, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const factsSchema = pgSchema("facts");

export const metricFact = factsSchema.table("metric_fact", {
  productId: text("product_id").notNull(),
  metricName: text("metric_name").notNull(),
  metricVersion: integer("metric_version").notNull(),
  tier: text("tier").notNull(),
  grain: text("grain").notNull(),
  repoId: text("repo_id"), // Nullable FKs
  contributorId: text("contributor_id"),
  clusterId: text("cluster_id"),
  periodStart: timestamp("period_start"),
  grainKey: text("grain_key").notNull(), // The idempotency backbone
  valueNum: integer("value_num"),
  valueJson: jsonb("value_json"),
}, (table) => ({
  factUnq: uniqueIndex("idx_metric_fact_unq").on(
    table.productId, table.metricName, table.metricVersion, table.grainKey
  )
}));
```

## Error Handling

### Error Scenarios
1. **Migration Failure**
   - **Handling:** Run migrations inside a DDL transaction where supported. Wait/Timeout on lock.
   - **Impact:** System fails to deploy, triggering an automated CI/CD rollback.

2. **Missing Tenancy Context**
   - **Handling:** The `withTenant` wrapper throws a `TenancyViolationError` if `productId` is undefined.
   - **Impact:** Query fails safely without executing against the database. No cross-tenant data leakage.

## Testing Strategy

### Unit Testing
- Test the schema generation logic.
- Test the `withTenant` wrapper using Drizzle's dummy/mock driver to ensure the generated SQL string contains the `product_id` WHERE clause.

### Integration Testing
- Stand up a local PostgreSQL container (via Docker/Testcontainers).
- Execute `drizzle-kit push` or run migrations against the container.
- Perform CRUD operations to verify schema constraints (especially the `UNIQUE` idempotency constraints on `metric_fact`).
