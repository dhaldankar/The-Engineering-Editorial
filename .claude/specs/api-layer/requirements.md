# Requirements Document

## Introduction

The **API Layer** is the synchronous request/response plane of the Engineering Insights platform. It exposes RESTful endpoints via AWS API Gateway to the Frontend SPA. The API handles CRUD operations for configuration (tenants, repositories, connectors, clusters, workflow mappings), reads computed metrics (facts), and orchestrates long-running asynchronous jobs (triggering Syncs and Reports) by returning polling references to the client.

## Alignment with Product Vision

The API acts as the strict tenancy gatekeeper and asynchronous delegator. It ensures the frontend remains snappy by strictly offloading any task over a few seconds to Step Functions and SQS, while maintaining the non-negotiable security requirement that no tenant can ever see data lacking their `product_id`.

## Requirements

### Requirement 1 — Authentication and Tenancy Routing

**User Story:** As the API gateway, I want to authenticate every request and enforce strict multi-tenancy, so that users can only access data belonging to their authorized Project.

#### Acceptance Criteria

1. WHEN an incoming request hits any tenant-scoped endpoint THEN the system SHALL validate the Cognito identity token via API Gateway authorizers.
2. IF a valid identity token is provided THEN the system SHALL resolve the token to an `account` and enforce that the account belongs to the requested `product_id` (Project).
3. IF the caller is not authorized for the requested `product_id` THEN the system SHALL return `403 Forbidden`.

### Requirement 2 — Project & Repository Management

**User Story:** As an authenticated user, I want to manage Projects and their Repositories, so that I can configure the analytical scope of my organization.

#### Acceptance Criteria

1. WHEN a `GET /products/current` request is made THEN the system SHALL return the Product associated with the caller's account.
2. WHEN a `GET /repositories` request is made THEN the system SHALL return all repositories associated with the current Product.
3. WHEN a `POST /repositories` request is made with a new repository configuration (including GitHub and Jira pointers) THEN the system SHALL validate unique keys and create the repository row.
4. IF a `POST /repositories` request introduces a duplicate key for the same `product_id` THEN the system SHALL return `409 Conflict`.

### Requirement 3 — Connector Management

**User Story:** As a Project admin, I want to manage GitHub and Jira data connectors at both the Project and Repository level, so that I can securely grant the platform ingestion access.

#### Acceptance Criteria

1. WHEN a `GET /products/current/connector` request is made THEN the system SHALL return the connector metadata (excluding raw secrets) and connectivity status.
2. WHEN a `POST /repositories/{id}/connector/test` request is made THEN the system SHALL synchronously verify token validity against the external provider and return the live connection status.
3. WHEN a `PUT` or `DELETE` request is made to connector endpoints THEN the system SHALL securely update or tombstone the underlying KMS-encrypted secrets.

### Requirement 4 — Asynchronous Job Triggering (Sync & Reports)

**User Story:** As a frontend user, I want to trigger data syncs and report generation without waiting for the response to finish, so that my UI does not block on heavy lifting.

#### Acceptance Criteria

1. WHEN a `POST /repositories/{id}/sync` request is made THEN the system SHALL enqueue an SQS message for the intake pipeline and immediately return `202 Accepted` with a `run_id`.
2. WHEN a `POST /repositories/{id}/reports` request is made THEN the system SHALL trigger the Step Functions report DAG and return `202 Accepted` with a job identifier.
3. WHEN a polling request (e.g., `GET /repositories/{id}/sync/runs/{run_id}`) is made THEN the system SHALL return the durable status row showing if the job is `in_progress`, `completed`, or `failed`.

### Requirement 5 — Config CRUD (Clusters & Workflow Mappings)

**User Story:** As a repository admin, I want to curate my code clusters and Jira workflow mappings, so that the computed metrics align with my team's reality.

#### Acceptance Criteria

1. WHEN a `PATCH /repositories/{id}/clusters/{cluster_id}` request is made THEN the system SHALL update the cluster configuration and mark its `curation_status` accordingly.
2. WHEN a `POST /repositories/{id}/clusters/recompute` request is made THEN the system SHALL trigger the recompute job (async) and return `202 Accepted`.
3. WHEN a `PUT /repositories/{id}/workflow-mappings` request is made THEN the system SHALL overwrite the unconfirmed mappings for that repository.

### Requirement 6 — Analytical Reads (Facts & Signals)

**User Story:** As a dashboard viewer, I want to load pre-computed metrics and signals, so that I can see my repository's health instantly.

#### Acceptance Criteria

1. WHEN a `GET /repositories/{id}/stats` request is made THEN the system SHALL query the Gold-tier `facts` namespace and return aggregate metrics under 500ms.
2. WHEN a `GET /repositories/{id}/reports/{id}/data` request is made THEN the system SHALL retrieve the frozen `report_signal` rows for the requested report.

## Non-Functional Requirements

### Code Architecture and Modularity
- **API Handlers:** Implement using AWS Lambda handlers wrapped with Middy. AWS Powertools should be used for standardized tracing, logging, and metrics.
- **Service Layer Separation:** Handlers must only perform validation and routing. All business logic and external orchestrations (SQS, Step Functions) must reside in isolated service files.
- **DTOs:** Shared contracts must be represented as TypeScript interfaces stored in `packages/core-types`.

### Performance
- Synchronous CRUD and read endpoints SHALL respond in under 500ms.
- Asynchronous triggers SHALL respond with a `202 Accepted` within 200ms without blocking on upstream services.

### Security
- **Strict Tenancy:** The API SHALL securely map the Cognito identity to a `product_id` at the edge and explicitly append it to every downstream DB query.
- **Secrets Management:** The API SHALL never return decrypted access tokens to the frontend; it only returns masked metadata.

### Reliability
- The API SHALL use RDS Proxy or the Aurora Data API to prevent Lambda burst concurrency from exhausting database connections.
