# Requirements Document

## Introduction

The `packages/core-types` library is the foundational domain layer of Engineering Insights. It defines the shared TypeScript interfaces, Zod validation schemas, Data Transfer Objects (DTOs), and enums that constitute the wire and storage contracts.

## Alignment with Product Vision

To ensure strict type safety across a distributed serverless architecture and a React frontend, a single source of truth for data shapes is mandatory. By placing all domain models in `core-types`, the API, pipeline workers, and frontend UI remain perfectly synchronized, drastically reducing serialization bugs and integration friction.

## Requirements

### Requirement 1: Database Entity Contracts

**User Story:** As a backend service, I need strictly defined entity schemas so that I can safely insert and read data from Aurora Postgres without structural errors.

#### Acceptance Criteria
1. The package SHALL define Zod schemas and infer TypeScript interfaces for all five database namespaces (`core`, `config`, `facts`, `report`, `review_lens`).
2. WHEN defining `core` entities (e.g., `github_prs`, `work_items`) THEN the schemas SHALL accurately reflect the canonical relationships and nullable foreign keys outlined in the architecture.

### Requirement 2: API Wire Contracts (DTOs)

**User Story:** As an API and Frontend developer, I need shared request/response types so that my HTTP payloads are strictly validated on both ends.

#### Acceptance Criteria
1. The package SHALL expose DTO schemas for all REST API endpoints.
2. WHEN the API receives a POST request THEN it SHALL use `core-types` Zod schemas to fail-fast on invalid payloads before processing.

### Requirement 3: Enforced Standard Vocabularies

**User Story:** As the metric harness, I need fixed dimension and status vocabularies so that metrics generalize cleanly across all tenants.

#### Acceptance Criteria
1. The package SHALL define the closed grain vocabulary enum (`repo`, `contributor`, `cluster`, `pr`, `work_item`, `period`).
2. The package SHALL define the canonical lifecycle phases enum (`backlog`, `ready`, `in_dev`, `review`, `qa`, `done`).

## Non-Functional Requirements

### Code Architecture and Modularity
- **Strict Leaf Node**: `core-types` must sit at the absolute bottom of the dependency graph. It is strictly forbidden from importing any other `apps/*` or `packages/*` within the monorepo.
- **Zero Business Logic**: The package must contain only types, Zod schemas, constants, and enums. It must not contain database queries, network calls, or heavy computation.
