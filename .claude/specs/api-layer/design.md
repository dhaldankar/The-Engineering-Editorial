# Design Document

## Overview

The API Layer forms the synchronous gateway between the React frontend SPA and the serverless backend pipeline. Deployed to AWS API Gateway + Lambda, it enforces tenancy, handles CRUD operations for system configuration, serves fast analytical reads from the Aurora Postgres database, and orchestrates async workflows by enqueueing messages to SQS and Step Functions.

## Steering Document Alignment

### Technical Standards (tech.md)
This design strictly implements the constraints defined in `architecture.md`:
- **Serverless-native:** Uses AWS Lambda, wrapped with Middy and AWS Powertools for observability.
- **Strict Tenancy:** API scopes every request under a `product_id`.
- **Async-First:** Endpoints that take >1 second must return `202 Accepted` with a job ID.

### Project Structure (structure.md)
Implementation will occur in the `apps/api` package, abiding by the dependency hierarchy dictated in `architecture.md` Section 3.

## Code Reuse Analysis

### Existing Components to Leverage
- **`packages/core-types`**: TypeScript interfaces defining request/response structures and `grain` definitions.
- **`packages/db-client`**: Postgres connection pooling (via RDS Proxy/Data API) and query builders.
- **`packages/config`**: Environment variable parsing and profile loading.
- **`packages/logger`**: Structured JSON logging.

### Integration Points
- **Amazon SQS**: For enqueueing sync intake tasks.
- **AWS Step Functions**: For triggering report generation and pipeline DAGs.
- **Amazon Aurora Postgres**: For reading `facts` and writing to `config` namespaces.
- **Amazon Cognito**: For authenticating incoming requests.

## Architecture

The API leverages an API Gateway HTTP API directing traffic to a fleet of Lambda functions. The codebase enforces a strict unidirectional dependency graph.

### Modular Design Principles
- **Handlers (`handlers/`)**: Pure translating layer. Maps HTTP events to domain services. Uses Middy middlewares for JSON parsing and schema validation.
- **Services (`services/`)**: The orchestrators. Perform business logic, apply `product_id` context, and communicate with adapters and repositories.
- **Repositories (`repositories/`)**: Encapsulate all raw SQL and database schema logic.
- **Adapters (`adapters/`)**: Wrappers for AWS SDK calls (SQS `sendMessage`, SFN `startExecution`).

```mermaid
graph TD
    A[API Gateway] --> B[Lambda Handler (Middy)]
    B --> C[Service Layer]
    C --> D[Repository Layer]
    C --> E[Adapter Layer]
    D --> F[(Aurora Postgres)]
    E --> G[SQS / Step Functions]
```

## Components and Interfaces

### Auth Middleware (Middy)
- **Purpose:** Extracts the Cognito token, verifies it, resolves the user `account`, and attaches the `product_id` to the request context.
- **Interfaces:** Middy `before` hook.
- **Dependencies:** Cognito JWT verification library.

### Jobs Service
- **Purpose:** Handles the triggering of syncs and reports.
- **Interfaces:** `triggerSync(repoId)`, `triggerReport(repoId, type, period)`
- **Dependencies:** SQS Adapter, Step Functions Adapter, Jobs Repository.
- **Reuses:** Core Types for async job models.

### Facts Repository
- **Purpose:** Performs fast read-only queries against the Gold-tier `metric_fact` store.
- **Interfaces:** `getStatsForRepo(productId, repoId)`
- **Dependencies:** `db-client`.

## Data Models

All models are defined as TypeScript interfaces in `core-types`.

### API Response Wrapper
```typescript
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    requestId: string;
    [key: string]: any;
  };
}
```

### Async Job Reference
```typescript
export interface AsyncJobRef {
  jobId: string;
  statusUrl: string; // The polling URL
  estimatedCompletionSeconds?: number;
}
```

## Error Handling

### Error Scenarios
1. **Unauthorized / Bad Token**
   - **Handling:** Middy auth middleware catches the error and throws an HttpError.
   - **User Impact:** API returns `401 Unauthorized` or `403 Forbidden`. Frontend redirects to login.

2. **Database Connection Exhaustion**
   - **Handling:** The `db-client` detects the failure. API returns `503 Service Unavailable`.
   - **User Impact:** Frontend displays a generic retryable error state.

3. **Unique Constraint Violation (e.g., Duplicate Repo Key)**
   - **Handling:** Repository layer catches the Postgres unique constraint error and bubbles a specific Domain Error.
   - **User Impact:** API returns `409 Conflict`. Frontend maps this to field-level validation errors.

## Testing Strategy

### Unit Testing
- Test Services and Repositories in isolation using Jest/Vitest.
- Mock the `db-client` and AWS SDK adapters to verify business logic and tenancy enforcement.

### Integration Testing
- Use a local PostgreSQL instance and LocalStack (or AWS SAM Local) to test the Lambda Handlers end-to-end against a real database.
- Key flows to test: Tenancy isolation (trying to read another product's data), Job enqueueing.
