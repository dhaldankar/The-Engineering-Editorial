# Tasks Document

## Core Configuration and Middleware

- [ ] 1. Set up API environment configuration
  - File: apps/api/src/config/env.ts
  - Implement fail-fast typed env checks for DB URIs, SQS Queue URLs, and Cognito Pools
  - Purpose: Ensure execution context is complete before handling requests
  - _Requirements: Non-Functional (Reliability)_
  - _Prompt: Role: DevOps Engineer | Task: Create Zod validation schema for API environment variables | Restrictions: Fail fast and crash Lambda if variables are missing | Success: Lambda refuses to start if improperly configured_

- [ ] 2. Implement Uniform HTTP Responders
  - File: apps/api/src/core/http.ts
  - Create standard API Gateway JSON responder utilities (`ok`, `accepted`, `badRequest`, etc.)
  - Purpose: Standardize response formats across all endpoints
  - _Requirements: Non-Functional (Architecture)_
  - _Prompt: Role: API Developer | Task: Implement HTTP utility functions for API Gateway proxy responses | Restrictions: Ensure proper CORS headers are included | Success: Consistent JSON structures and status codes returned globally_

- [ ] 3. Create Authentication Middleware
  - File: apps/api/src/core/middleware/auth-middleware.ts
  - Verify Cognito JWT claims and extract tenant ID (`product_id`)
  - Purpose: Ensure strict multi-tenancy and authorization
  - _Requirements: 1.1, 1.2, 1.3_
  - _Prompt: Role: Security Engineer | Task: Implement JWT verification middleware for Amazon Cognito | Restrictions: Reject on invalid signature or expiration; inject product_id into request context securely | Success: Unauthorized requests blocked; handlers safely receive context_

- [ ] 4. Create Body Validation Middleware
  - File: apps/api/src/core/middleware/validate-body.ts
  - Validate incoming request bodies against strict Zod DTOs
  - Purpose: Ensure API consumers send correctly formatted data
  - _Requirements: 3.1_
  - _Prompt: Role: Backend Developer | Task: Create higher-order function middleware to validate bodies using Zod | Restrictions: Catch errors and map to 400 Bad Request with readable messages | Success: Invalid payloads never reach handler logic_

## DTOs and Data Contracts

- [ ] 5. Define Dashboard Metrics and Sync Job DTOs
  - Files: apps/api/src/dto/metrics.ts, apps/api/src/dto/sync-job.ts
  - Create wire contracts for dashboard numbers and poll payloads
  - Purpose: Enforce strict typings for API inputs and outputs
  - _Requirements: 2.2_
  - _Prompt: Role: Typescript Developer | Task: Define Zod schemas for metrics responses and sync job payloads | Restrictions: Align property names precisely with frontend expectations | Success: Types successfully compile and export strictly inferred interfaces_

## Repositories and Adapters

- [ ] 6. Implement Metrics and Config Repositories
  - Files: apps/api/src/repositories/metrics-repository.ts, apps/api/src/repositories/config-repository.ts
  - Implement functions to query Gold tier facts and tenant configuration
  - Purpose: Handle data reads securely using tenant context
  - _Leverage: packages/db-client_
  - _Requirements: 2.1_
  - _Prompt: Role: Database Engineer | Task: Implement fast read repositories targeting Postgres facts schema | Restrictions: Enforce product_id filtering on every query | Success: Repositories securely fetch isolated data instantly_

- [ ] 7. Implement SQS and Step Functions Adapters
  - Files: apps/api/src/adapters/sqs-adapter.ts, apps/api/src/adapters/stepfunctions-adapter.ts
  - Push trigger messages and start state machines
  - Purpose: Hand off long-running jobs to the Async Pipeline Plane
  - _Requirements: 3.2, 3.3_
  - _Prompt: Role: Cloud Developer | Task: Create AWS SDK wrappers to push SQS messages and trigger SFN | Restrictions: Handle transient SDK errors | Success: Adapters seamlessly trigger downstream async systems_

## HTTP Handlers

- [ ] 8. Implement Dashboard Read Handlers
  - Files: apps/api/src/handlers/http/get-metrics-overview-handler.ts, apps/api/src/handlers/http/get-cycle-time-handler.ts, apps/api/src/handlers/http/get-allocation-handler.ts
  - Expose API Gateway lambda handlers for frontend data retrieval
  - Purpose: Serve dashboard data instantly
  - _Requirements: 2.1_
  - _Prompt: Role: API Developer | Task: Create Lambda handlers orchestrating middleware and metrics repository | Restrictions: Do not perform aggregations in handlers | Success: Metrics returned efficiently inside standard HTTP responses_

- [ ] 9. Implement Async Job Trigger Handlers
  - Files: apps/api/src/handlers/http/post-sync-handler.ts, apps/api/src/handlers/http/get-sync-status-handler.ts
  - Handle POST requests for starting jobs and GET requests for status polling
  - Purpose: Enable asynchronous tasks without blocking the UI
  - _Requirements: 3.1, 4.1_
  - _Prompt: Role: Backend Developer | Task: Implement handlers to start async jobs via SQS adapter and read status | Restrictions: POST handlers must return 202 Accepted | Success: System successfully delegates jobs and serves current job status to frontend_
