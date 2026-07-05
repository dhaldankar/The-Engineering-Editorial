# Tasks Document

## Core Setup

- [ ] 1. Set up Worker environment configuration
  - File: apps/workers/src/config/env.ts
  - Implement validation for Bedrock model definitions and DB environment configurations
  - Purpose: Ensure execution context is complete before Lambda runs
  - _Requirements: 3.1, Non-Functional (Architecture)_
  - _Prompt: Role: DevOps Engineer | Task: Create Zod validation schema for Bedrock models and DB env configs | Restrictions: Do not load configs redundantly; fail fast | Success: Lambda configuration validated before handlers execute_

- [ ] 2. Define Error Taxonomy and Pipeline State DTOs
  - Files: apps/workers/src/core/errors.ts, apps/workers/src/dto/pipeline-payloads.ts
  - Implement explicit error classes mapping to SFN retry policies
  - Define Zod schemas for Step Function state chunks
  - Purpose: Structured error management and strict data passing between SFN states
  - _Requirements: Non-Functional (Error Handling)_
  - _Prompt: Role: System Architect | Task: Define custom error classes for Step Functions (transient vs terminal) and state chunk schemas | Restrictions: Maintain strict typing; align error names with SFN Catch/Retry blocks | Success: Errors correctly trigger backoff; payload schema passes validation_

- [ ] 3. Create Pipeline Core Utilities
  - File: apps/workers/src/core/pipeline.ts
  - Implement wrappers for Step Function `Map` context and execution context extraction
  - Purpose: Standardize SFN context handling across Lambdas
  - _Requirements: Non-Functional (Architecture)_
  - _Prompt: Role: Backend Developer | Task: Implement SFN Map context wrapper | Restrictions: Ensure robust handling of chunk bounds | Success: Helpers reliably extract and manage state execution context_

## External Adapters

- [ ] 4. Implement External Connectors (GitHub & Jira)
  - Files: apps/workers/src/adapters/github-adapter.ts, apps/workers/src/adapters/jira-adapter.ts
  - Build REST clients with backoff and pagination limits
  - Purpose: Safe and reliable ingestion of third-party data
  - _Requirements: 1.2_
  - _Prompt: Role: Integration Developer | Task: Build GitHub and Jira REST adapters | Restrictions: Respect 15-minute execution limit by honoring pagination cursors | Success: Clients efficiently stream pages of data without memory leaks_

- [ ] 5. Implement Bedrock Adapter
  - File: apps/workers/src/adapters/bedrock-adapter.ts
  - Create safe LLM invocation client with built-in retry safety
  - Purpose: Enrich text using LLMs (e.g., sentiment analysis)
  - _Requirements: 3.1, 3.2_
  - _Prompt: Role: AI Engineer | Task: Implement AWS Bedrock invoke wrapper | Restrictions: Catch and throw specific RateLimitErrors defined in core/errors.ts | Success: LLM integration is stable under high concurrency_

## Repositories

- [ ] 6. Implement S3 Bronze Repository
  - File: apps/workers/src/repositories/s3-bronze-repository.ts
  - Write raw JSON payloads from adapters directly to S3
  - Purpose: Establish the immutable Bronze data lake
  - _Requirements: 1.2_
  - _Prompt: Role: Data Engineer | Task: Implement S3 Bronze repository | Restrictions: Write data exactly as fetched (no mutation) | Success: Successfully stores partitioned JSON files in S3_

- [ ] 7. Implement Core Entities Repository (Silver)
  - File: apps/workers/src/repositories/core-entities-repository.ts
  - Upsert logic for canonical entities (`work_items`, `github_prs`)
  - Purpose: Transition data from Bronze to Silver tier
  - _Leverage: packages/db-client_
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: Database Engineer | Task: Build canonical entity repository | Restrictions: Log unresolved identities instead of dropping rows | Success: Normalizes JSON into relational schema reliably_

- [ ] 8. Implement Facts Repository (Gold)
  - File: apps/workers/src/repositories/facts-repository.ts
  - Handle Gold metric upserts using `grain_key` unique constraints
  - Purpose: Maintain idempotent metric accumulation
  - _Leverage: packages/db-client_
  - _Requirements: 4.2_
  - _Prompt: Role: Database Engineer | Task: Implement facts repository using upserts on grain_key | Restrictions: Ensure absolute idempotency | Success: Fact records are safely upserted without duplication_

## Services

- [ ] 9. Implement Ingest Service
  - File: apps/workers/src/services/ingest-service.ts
  - Orchestrate adapters and `s3-bronze-repository`
  - Purpose: Stream files to S3 and update high-water sync marks
  - _Requirements: 1.2_
  - _Prompt: Role: Backend Developer | Task: Implement Ingest Service | Restrictions: Manage memory carefully during streaming | Success: Accurately records sync progress and stores data_

- [ ] 10. Implement Metric Executor Service
  - File: apps/workers/src/services/metric-executor-service.ts
  - Execute registry SQL queries in topologically sorted DAG order
  - Purpose: Bulk compute metrics
  - _Leverage: packages/harness_
  - _Requirements: 4.1_
  - _Prompt: Role: Backend Developer | Task: Implement metric execution orchestrator | Restrictions: Must respect declared dependencies | Success: Metrics execute safely in the correct order_

## Event Handlers

- [ ] 11. Implement Task Handlers (SFN & SQS)
  - Files: apps/workers/src/handlers/events/*.ts
  - Connect SQS events and Step Function payloads to corresponding services
  - Purpose: Expose logic to AWS execution context
  - _Requirements: 1.1, Non-Functional (Architecture)_
  - _Prompt: Role: Serverless Developer | Task: Implement event handlers for SQS intake, ingest, normalize, enrich, and aggregate tasks | Restrictions: Skip HTTP parsing, directly parse event records | Success: Lambda correctly delegates SFN execution context to services_
