# Tasks Document

## Turborepo Setup

- [ ] 1. Configure Monorepo orchestration
  - File: turbo.json
  - Define task pipelines for `build`, `test`, `lint`, and `deploy`
  - Purpose: Ensure efficient, cached, topological builds across packages and apps
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: DevOps Engineer | Task: Create turbo.json configuration for a pnpm monorepo | Restrictions: Properly map dependencies (e.g., ^build) and define cache outputs | Success: `turbo run build` correctly determines order and caches artifacts_

## Infrastructure Core

- [ ] 2. Setup CDK Application Entry Point
  - Files: infra/bin/sahayak.ts, infra/lib/config.ts
  - Initialize the CDK App, load environment context, and instantiate stacks
  - Purpose: Orchestrate the deployment of the entire cloud topology
  - _Requirements: Non-Functional (Architecture)_
  - _Prompt: Role: Cloud Architect | Task: Create CDK entry point orchestrating core, api, workers, and integration stacks | Restrictions: Pass stack outputs as props downstream securely | Success: CDK synth runs successfully generating CloudFormation templates_

- [ ] 3. Implement Core Stack
  - File: infra/lib/core-stack.ts
  - Provision VPC, Aurora Serverless v2, RDS Proxy, Cognito User Pool, and S3 Bronze bucket
  - Purpose: Establish the foundational persistent and networking layer
  - _Requirements: 2.1, 2.2, 2.3_
  - _Prompt: Role: AWS Infrastructure Engineer | Task: Implement CDK Core Stack | Restrictions: Ensure RDS Proxy is used for Lambda connection pooling; use private subnets for DB | Success: Core resources provisioned securely and ARNs exposed as stack properties_

## Application Stacks

- [ ] 4. Implement API Stack
  - File: infra/lib/api-stack.ts
  - Provision API Gateway, bundle `apps/api` Lambdas, and attach Cognito Authorizers
  - Purpose: Expose the synchronous API plane to the frontend
  - _Requirements: 3.1_
  - _Prompt: Role: Serverless Engineer | Task: Implement API Stack in CDK | Restrictions: Secure endpoints with Cognito Authorizer; inject DB Proxy URI from Core Stack | Success: API Gateway deployed with correctly bundled Lambdas_

- [ ] 5. Implement Integration Stacks
  - Files: infra/lib/integration-github-stack.ts, infra/lib/integration-jira-stack.ts
  - Provision isolated API Gateways for third-party OAuth and Webhooks
  - Purpose: Keep the security boundary of integrations isolated from the core API
  - _Requirements: 3.2_
  - _Prompt: Role: Cloud Security Engineer | Task: Implement separate CDK stacks for GitHub and Jira integrations | Restrictions: Expose endpoints publicly (no Cognito); grant Secrets Manager access | Success: Webhook and OAuth endpoints deploy independently_

## Asynchronous Pipeline

- [ ] 6. Implement Workers Stack
  - File: infra/lib/workers-stack.ts
  - Provision SQS intake queues, Step Function state machines, and task Lambdas
  - Purpose: Deploy the asynchronous processing plane
  - _Requirements: 4.1, 4.2, 4.3_
  - _Prompt: Role: Cloud Data Engineer | Task: Implement CDK Workers Stack with AWS Step Functions and SQS | Restrictions: Grant appropriate IAM roles (Bedrock, S3, RDS); configure SFN Map states | Success: DAGs correctly orchestrated and Lambdas have necessary execution permissions_
