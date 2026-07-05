# Requirements Document

## Introduction

The `api/` sub-app serves as the Synchronous REST API Plane for Engineering Insights. It is built as a set of AWS Lambda functions situated behind API Gateway. Its primary responsibilities are serving pre-computed data to the frontend dashboards, validating client requests, and enqueuing long-running asynchronous jobs.

## Alignment with Product Vision

To maintain a fast and highly responsive user interface, the API is deliberately "thin". It avoids complex computations and heavy data aggregations on the fly. Instead, it reads pre-computed facts (Gold tier) instantly, and delegates all heavy lifting to the `workers` pipeline by returning a `202 Accepted` response with a polling job identifier.

## Requirements

### Requirement 1: Authentication and Multi-tenancy

**User Story:** As the system, I want to authenticate incoming requests so that data access is strictly limited to the caller's authorized tenant namespace.

#### Acceptance Criteria
1. WHEN a request is received THEN the `auth-middleware` SHALL verify the Amazon Cognito claims.
2. WHEN the claims are valid THEN the middleware SHALL extract the `product_id` (tenant ID) and inject it into the request context.
3. IF authentication fails THEN the system SHALL immediately return a `401 Unauthorized` response.

### Requirement 2: Fast Data Retrieval (Dashboards)

**User Story:** As a user, I want my dashboards to load instantly so I can quickly view my engineering metrics (cycle time, allocation).

#### Acceptance Criteria
1. WHEN the frontend requests metrics THEN the HTTP handlers (e.g., `get-cycle-time-handler`) SHALL use the `metrics-repository` to read directly from the PostgreSQL Gold tier facts.
2. WHEN data is returned THEN it SHALL be formatted strictly according to the structures defined in `dto/metrics.ts`.

### Requirement 3: Triggering Asynchronous Jobs

**User Story:** As a user, I want to initiate a repository synchronization or report generation without my browser hanging while it processes.

#### Acceptance Criteria
1. WHEN a sync request is POSTed THEN the `post-sync-handler` SHALL validate the request payload using `validate-body` middleware.
2. WHEN valid THEN the handler SHALL push a trigger message via `sqs-adapter` and return a `202 Accepted` response containing a job ID for polling.
3. WHEN a report is requested THEN the handler SHALL start the state machine via `stepfunctions-adapter`.

### Requirement 4: Real-Time Status Polling

**User Story:** As a user, I want to see the progress of my background jobs so I know when they complete.

#### Acceptance Criteria
1. WHEN the frontend polls for status THEN the `get-sync-status-handler` SHALL read the durable status state and return the current completion percentage and terminal states (`completed` / `failed`).

## Non-Functional Requirements

### Code Architecture and Modularity
- **No Business Logic in Handlers**: Handlers must exclusively manage HTTP contexts (parsing parameters, invoking services/repositories, responding).
- **Uniform Responses**: The API must employ `core/http.ts` responders for consistent JSON structures and status codes across all endpoints.

### Reliability
- **Fail-Fast Initialization**: Environment variables (DB credentials, AWS region) must be statically typed and verified at cold start in `config/env.ts`. Missing variables must crash the Lambda immediately.
