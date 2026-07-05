# Tasks Document

- [ ] 1. Initialize `db-client` Package
  - File: `packages/db-client/package.json`
  - Setup Turborepo package, install `drizzle-orm`, `drizzle-kit`, `postgres`, and `@aws-sdk/client-rds-data`.
  - Configure `drizzle.config.ts` at the package root to point to the `src/schema` folder.
  - Purpose: Establish the foundation for the ORM layer.
  - _Requirements: NFR - Code Architecture_
  - _Prompt: Role: Node.js Backend Developer | Task: Initialize the `db-client` package with Drizzle ORM and Drizzle Kit dependencies. Setup `drizzle.config.ts`. | Restrictions: Must integrate seamlessly into the existing Turborepo monorepo. | Success: Package builds and `drizzle-kit generate` executes without errors on an empty schema._

- [ ] 2. Define `config` and `core` Schemas
  - Files: `src/schema/config.ts` and `src/schema/core.ts`
  - Implement Drizzle schemas for tenancy (`products`, `repositories`, `accounts`, `data_connectors`) and normalized entities (`contributors`, `work_items`, `github_prs`, `reviews`, `code_clusters`).
  - Purpose: Represent the tenancy root and the Silver-tier data accurately.
  - _Leverage: architecture.md Section 4.2 and 4.3_
  - _Requirements: 3.1_
  - _Prompt: Role: Database Architect | Task: Create Drizzle pgSchema definitions for the `config` and `core` namespaces exactly as outlined in the architecture spec. | Restrictions: Ensure strict types and explicit foreign keys. | Success: Schemas compile and generate correct SQL migrations._

- [ ] 3. Define `facts`, `report`, and `review-lens` Schemas
  - Files: `src/schema/facts.ts`, `src/schema/report.ts`, `src/schema/review-lens.ts`
  - Implement the Gold-tier `metric_fact` with its idempotency backbone, and the tables for async reports and blindspot rules.
  - Purpose: Represent the analytical and operational records of the pipeline.
  - _Leverage: architecture.md Section 4.4, 4.5, 4.6_
  - _Requirements: 3.1, 3.2, 3.3_
  - _Prompt: Role: Database Architect | Task: Create Drizzle pgSchema definitions for the remaining namespaces. Implement the complex unique composite index on `metric_fact`. | Restrictions: Nullable dimension FKs must be handled carefully. | Success: Schema enforces the `UNIQUE(product_id, metric_name, metric_version, grain_key)` constraint._

- [ ] 4. Build Client Factory
  - File: `src/index.ts`
  - Implement `createDbClient(config)` which switches between `postgres.js` (for Proxy) and `@aws-sdk/client-rds-data` (for Data API).
  - Purpose: Manage Aurora connections safely depending on the consumer's runtime (Worker vs API).
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: AWS Serverless Developer | Task: Write a factory function that returns a unified Drizzle client. If `mode === 'proxy'`, initialize `postgres.js`. If `mode === 'data-api'`, initialize the AWS RDS Data client. | Restrictions: Hide the underlying driver differences from the consumer. | Success: Factory returns a usable Drizzle instance in both modes._

- [ ] 5. Implement the Runtime Migrator
  - File: `src/migrator.ts`
  - Implement an AWS Lambda handler script using Drizzle's `migrate()` function to execute the static SQL revisions inside `migrations/`.
  - Purpose: Expose an executable payload for the custom CoreStack Lambda to run during deployment.
  - _Requirements: 4.2_
  - _Prompt: Role: DevOps Engineer | Task: Write a Lambda handler in `src/migrator.ts` that connects to the database via `postgres.js` and applies migrations from the `migrations/` folder. | Restrictions: Must safely handle timeouts and lock errors. | Success: Handler successfully applies pending migrations._

- [ ] 6. Implement Tenancy Enforcer
  - File: `src/tenancy.ts`
  - Write a utility wrapper that automatically injects `.where(eq(schema.productId, context.productId))` to queries.
  - Purpose: Structurally prevent cross-tenant data leaks.
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: Security Engineer | Task: Implement a query wrapper for Drizzle that enforces the `product_id` filter on all read/write operations against tenant-scoped tables. | Restrictions: Must fail-closed if `product_id` is missing. | Success: Wrapper modifies SQL queries to securely isolate tenant data._

- [ ] 6. End-to-End Migration & Integration Tests
  - File: `tests/integration.test.ts`
  - Setup a local PostgreSQL database.
  - Run `drizzle-kit push` or execute generated migrations.
  - Purpose: Validate that schemas and tenancy wrappers work against a real database.
  - _Requirements: 4.1, 4.2, 4.3_
  - _Prompt: Role: QA Automation Engineer | Task: Write integration tests that stand up a local Postgres DB, run the Drizzle migrations, and test the Tenancy Enforcer against dummy data. | Restrictions: Must test cross-tenant query rejections explicitly. | Success: All tests pass and migrations apply cleanly._
