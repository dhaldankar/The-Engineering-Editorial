# Tasks Document

## Initial Package Setup

- [ ] 1. Initialize `packages/core-types` library
  - Files: packages/core-types/package.json, packages/core-types/tsconfig.json, packages/core-types/src/index.ts
  - Create standard configuration files for a typescript package within the Turborepo workspace.
  - Purpose: Establish the library structure and module boundaries.
  - _Requirements: Non-Functional (Code Architecture)_
  - _Prompt: Role: TypeScript Developer | Task: Initialize core-types package configuration | Restrictions: Target Node/ES modules appropriately; include `zod` as a dependency | Success: Package builds and can be imported cleanly by other monorepo workspaces_

## Enums and Constants

- [ ] 2. Define Shared Enumerations
  - Files: packages/core-types/src/enums/grains.ts, packages/core-types/src/enums/lifecycle.ts
  - Implement Zod enums for grain dimensions and software lifecycle phases.
  - Purpose: Enforce standard vocabularies across the platform.
  - _Requirements: 3.1, 3.2_
  - _Prompt: Role: Domain Architect | Task: Define shared domain enums using Zod | Restrictions: Stick exactly to the architecture definitions (e.g., backlog, ready, in_dev, review, qa, done) | Success: Enums are strictly typed and exportable_

## Database Entity Definitions

- [ ] 3. Define Core and Config Entities
  - Files: packages/core-types/src/entities/core.ts, packages/core-types/src/entities/config.ts
  - Create Zod schemas for Silver tier (Contributors, WorkItems, PRs) and configuration settings (Products, Repositories, Connectors).
  - Purpose: Represent canonical domain models accurately.
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: Data Modeler | Task: Create Zod schemas mapping to the `core` and `config` DB namespaces | Restrictions: Accurately map nullable foreign keys and UUIDs | Success: Schemas infer correct TypeScript types and validate objects_

- [ ] 4. Define Facts, Report, and Review Lens Entities
  - Files: packages/core-types/src/entities/facts.ts, packages/core-types/src/entities/report.ts, packages/core-types/src/entities/review-lens.ts
  - Create Zod schemas for the Gold tier metric facts, async reports, and blindspot classification rules.
  - Purpose: Represent aggregated analytics and reporting models.
  - _Requirements: 1.1_
  - _Prompt: Role: Data Analyst / Modeler | Task: Create Zod schemas mapping to the `facts`, `report`, and `review_lens` namespaces | Restrictions: Ensure `grain_key` is present and `value_num`/`value_json` are correctly typed in MetricFact | Success: Strict schema definitions for metrics_

## DTO Definitions

- [ ] 5. Define API and Webhook DTOs
  - Files: packages/core-types/src/dto/api-requests.ts, packages/core-types/src/dto/api-responses.ts, packages/core-types/src/dto/webhooks.ts
  - Build the HTTP request/response payloads for frontend APIs and external third-party webhooks.
  - Purpose: Guarantee strict HTTP contracts across services.
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: API Architect | Task: Define Zod DTO schemas for API requests, dashboard metric responses, and GitHub/Jira webhooks | Restrictions: Ensure schemas align exactly with frontend dashboard requirements | Success: Handlers can pass these to `validate-body` securely_

- [ ] 6. Export all modules
  - File: packages/core-types/src/index.ts
  - Group and export all defined enums, entities, and DTOs cleanly for consumption.
  - Purpose: Provide a clean barrel file interface to consumers.
  - _Requirements: Non-Functional (Code Architecture)_
  - _Prompt: Role: TypeScript Developer | Task: Export all types and schemas from index.ts | Restrictions: Avoid naming collisions between similar entities and DTOs | Success: Consumer apps import from a single entry point efficiently_
