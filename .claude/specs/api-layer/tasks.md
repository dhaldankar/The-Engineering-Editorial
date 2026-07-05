# Tasks Document

- [ ] 1. Initialize API Package and Infrastructure
  - File: `apps/api/package.json` and `apps/api/serverless.yml`
  - Setup Turborepo package, install Middy, AWS Powertools, and Typescript dependencies.
  - Configure Serverless framework or SAM for API Gateway + Lambda routing.
  - Purpose: Establish the foundation for the serverless API.
  - _Requirements: NFR - Code Architecture_
  - _Prompt: Role: DevOps / Backend Developer | Task: Initialize the `apps/api` package with standard AWS Lambda, Middy, and AWS Powertools dependencies. Configure the deployment harness. | Restrictions: Must integrate seamlessly into the existing Turborepo monorepo. | Success: Package builds and a hello-world handler deploys to localstack/AWS successfully._

- [ ] 2. Define Core DTO Interfaces
  - File: `packages/core-types/src/api.ts`
  - Define request and response interfaces for Products, Repositories, Connectors, and Jobs.
  - Purpose: Establish strict type contracts between frontend and API.
  - _Requirements: NFR - Modularity_
  - _Prompt: Role: TypeScript Architect | Task: Create comprehensive TypeScript interfaces for the API DTOs in `packages/core-types` based on `requirements.md`. | Restrictions: No implementation logic, purely types. | Success: Interfaces are exported and consumable by both frontend and api packages._

- [ ] 3. Implement Auth & Tenancy Middleware
  - File: `apps/api/src/middleware/auth.ts`
  - Create a Middy middleware that verifies Cognito JWTs.
  - Map the identity to a `product_id` and attach it to the request context.
  - Purpose: Enforce strict multi-tenancy at the edge.
  - _Leverage: AWS Cognito JWT Verifier_
  - _Requirements: 1.1, 1.2, 1.3_
  - _Prompt: Role: Security Engineer | Task: Implement Middy middleware that validates Cognito tokens and assigns the resolved `product_id` to the request context. | Restrictions: Fail closed (401/403) on any validation error. | Success: Middleware correctly extracts context and rejects invalid requests._

- [ ] 4. Implement Repository and Service Layers
  - File: `apps/api/src/repositories/` and `apps/api/src/services/`
  - Build `ProductService`, `RepositoryService`, and `ConnectorService`.
  - Implement read models against `metric_fact` for the Dashboard stats.
  - Purpose: Encapsulate database access and business logic safely behind tenancy constraints.
  - _Leverage: `packages/db-client`_
  - _Requirements: 2.1 - 2.4, 3.1 - 3.3, 6.1_
  - _Prompt: Role: Backend Node.js Developer | Task: Implement the data access and business logic services for Products, Repositories, Connectors, and Facts. | Restrictions: Every database call MUST include the `product_id` filter. | Success: Services perform their tasks efficiently using RDS proxy / Data API._

- [ ] 5. Implement Async Job Orchestration Adapters
  - File: `apps/api/src/adapters/`
  - Build AWS SDK wrappers to send SQS messages (Sync) and start Step Functions (Reports).
  - Purpose: Offload heavy operations to the async pipeline.
  - _Leverage: `@aws-sdk/client-sqs`, `@aws-sdk/client-sfn`_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: AWS Serverless Engineer | Task: Create adapter classes that trigger SQS for syncing and Step Functions for reports, returning job references. | Restrictions: Must not block on downstream execution. | Success: Messages are successfully enqueued and 202 references are generated._

- [ ] 6. Implement Lambda Handlers
  - File: `apps/api/src/handlers/`
  - Wire up the API Gateway routes to the Services and Adapters.
  - Apply the Middy Auth middleware and JSON body parser.
  - Purpose: Expose the REST API to the frontend.
  - _Requirements: All functional requirements_
  - _Prompt: Role: Backend API Developer | Task: Implement the Lambda handler entry points for all defined routes. Wire them to the services. | Restrictions: Handlers must only contain HTTP mapping and validation logic, no business logic. | Success: Endpoints correctly route HTTP requests to services and return standardized JSON responses._

- [ ] 7. End-to-End API Integration Tests
  - File: `apps/api/tests/`
  - Write integration tests verifying tenancy isolation, validation, and async triggers.
  - Purpose: Prevent regressions and ensure security constraints hold.
  - _Requirements: NFR - Security and Reliability_
  - _Prompt: Role: QA Automation Engineer | Task: Write integration tests for the Lambda handlers using a local mock environment. | Restrictions: Must explicitly test unauthorized cross-tenant access attempts. | Success: Tests pass and cover edge cases._
