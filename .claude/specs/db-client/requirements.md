# Requirements Document

## Introduction

The `db-client` package is the centralized, type-safe data access layer for the Engineering Insights platform. It encapsulates all access to the Amazon Aurora PostgreSQL Serverless v2 database. By isolating database logic into a single package, it guarantees strict multi-tenancy enforcement, manages connection limits across a highly concurrent serverless runtime, and houses all schema definitions and migrations natively.

## Alignment with Product Vision

The data architecture is defined by a Medallion pattern (Bronze, Silver, Gold). The `db-client` package enables the Silver and Gold tiers (normalized `core` and analytical `facts`) by providing the schema structure and querying mechanisms. It ensures that the heavy pipeline stages (async workers) and the thin API layer both access the database safely without exhausting connections or leaking tenant data.

## Requirements

### Requirement 1 — Connection Pooling & Transport

**User Story:** As the database engine, I want incoming connections to be efficiently managed, so that bursts of Lambda executions do not exceed my maximum connection limits.

#### Acceptance Criteria

1. WHEN instantiated in a long-running Step Function worker THEN the client SHALL connect to the database via AWS RDS Proxy to leverage connection pooling.
2. WHEN instantiated in a lightweight, short-lived API Gateway Lambda THEN the client SHALL support connection via the AWS Aurora Data API (or HTTP proxy) to eliminate connection overhead completely.
3. IF the connection drops or the proxy is temporarily saturated THEN the client SHALL retry using an exponential backoff strategy before throwing a fatal error.

### Requirement 2 — Strict Multi-Tenancy Enforcement

**User Story:** As a system administrator, I want multi-tenancy to be structurally enforced, so that no developer can accidentally leak data between Projects.

#### Acceptance Criteria

1. WHEN a query is constructed against any namespace (other than `config.products`) THEN the system SHALL require a `product_id` context to be explicitly provided.
2. IF a developer attempts to execute a read or write operation on a tenant-scoped table without applying a `product_id` filter THEN the client wrapper SHALL throw an assertion error before the query is dispatched to the database.

### Requirement 3 — Drizzle ORM Schema Definitions

**User Story:** As a backend developer, I want the database schema defined in code, so that I get strong TypeScript typings and autocomplete for all queries.

#### Acceptance Criteria

1. The client SHALL define Drizzle ORM schemas for all five physical namespaces: `core` (normalized entities), `config` (tenancy & auth), `facts` (metric stores), `report` (jobs & signals), and `review_lens` (blindspot rules).
2. WHEN writing to the `facts` namespace (Gold tier) THEN the schema SHALL define a composite unique constraint on `(product_id, metric_name, metric_version, grain_key)` to support idempotent UPSERT operations.
3. WHEN defining foreign keys in Drizzle THEN the schema SHALL map cross-references correctly but allow nullable dimensions on `facts` to support flexible analytical rollups.

### Requirement 4 — Migration Management

**User Story:** As a DevOps engineer, I want migrations to be declared in code and applied safely, so that the database schema evolves deterministically across environments.

#### Acceptance Criteria

1. WHEN the Drizzle schemas are modified THEN the developer SHALL use `drizzle-kit` to automatically generate the SQL migration files.
2. WHEN deploying to a new environment THEN the system SHALL run the migration script automatically (via a dedicated migration Lambda or CI step) before application traffic is routed.
3. IF a migration fails THEN the migration runner SHALL rollback the transaction safely without leaving the schema in an inconsistent state.

## Non-Functional Requirements

### Code Architecture and Modularity
- **ORM Choice**: Drizzle ORM is strictly used for schema definitions and query building.
- **Single Responsibility Principle**: The package exposes schema definitions, migration utilities, and a Client Factory. It does NOT contain application business logic (e.g., metric logic or API validation).
- **Clear Interfaces**: Exports a `createDbClient({ mode: 'proxy' | 'data-api', ... })` factory.

### Performance
- The Drizzle schemas SHALL NOT use excessive joins by default. Joins must be explicitly requested.
- Connection establishment via the Data API mode SHALL introduce less than 50ms of overhead.

### Security
- The package SHALL never hardcode database credentials. All credentials or IAM roles must be injected via the `packages/config` module at runtime.
- The multitenant boundary (`product_id`) is non-bypassable by design.
