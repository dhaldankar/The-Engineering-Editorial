# Requirements Document

## Introduction

This specification defines the infrastructure-as-code (IaC) layer using AWS CDK (located in `infra/`) and the monorepo build orchestration tool (`turbo.json`). The infrastructure layer accurately translates the platform's multi-plane architecture (API, Pipeline, Integrations) into provisioned AWS resources, while Turborepo ensures fast, incremental, caching builds across the workspace.

## Alignment with Product Vision

To maintain the high reliability and security required for a multi-tenant SaaS application handling sensitive source code and planning data, infrastructure must be defined declaratively in code. By mirroring the software boundaries (integrations vs. core API vs. async workers) in the AWS CDK stack boundaries, the deployment blast radius is minimized, fulfilling the core architectural directives.

## Requirements

### Requirement 1: Monorepo Orchestration

**User Story:** As a developer, I want to build and test the monorepo efficiently so that I can maintain high velocity without redundant waiting.

#### Acceptance Criteria
1. WHEN a build is triggered THEN `turbo.json` SHALL orchestrate dependencies between `packages/*` and `apps/*` correctly.
2. WHEN `turbo run build` is executed THEN it SHALL cache outputs to prevent rebuilding unchanged packages.

### Requirement 2: Core Persistent Infrastructure

**User Story:** As the system, I want a secure foundation of networking, databases, and authentication so that application stacks can operate securely.

#### Acceptance Criteria
1. WHEN the `core-stack` is deployed THEN it SHALL provision a VPC with private subnets.
2. The stack SHALL deploy an Amazon Aurora PostgreSQL Serverless v2 cluster and an RDS Proxy to handle Lambda connection pooling.
3. The stack SHALL deploy an Amazon Cognito User Pool for multi-tenant authentication and an Amazon S3 Bucket for the Bronze tier data ledger.

### Requirement 3: API & Integrations Provisioning

**User Story:** As an operator, I want to deploy the synchronous APIs and integration boundary apps so that the frontend and third-party tools can communicate with the platform.

#### Acceptance Criteria
1. WHEN the `api-stack` is deployed THEN it SHALL wire the `apps/api` Lambdas behind an Amazon API Gateway with Cognito Authorizers attached.
2. WHEN the `integration-github-stack` and `integration-jira-stack` are deployed THEN they SHALL expose isolated API Gateway endpoints for OAuth and Webhooks without sharing compute resources with the main API.

### Requirement 4: Asynchronous Pipeline Provisioning

**User Story:** As an operator, I want to deploy the background Step Functions and workers so that heavy data processing can occur async.

#### Acceptance Criteria
1. WHEN the `workers-stack` is deployed THEN it SHALL provision Amazon SQS intake queues.
2. The stack SHALL provision AWS Step Functions state machines for ingestion, normalization, enrichment, and aggregation DAGs.
3. The stack SHALL provision the task Lambdas and grant them appropriate execution roles for Bedrock, S3, and RDS Proxy access.

## Non-Functional Requirements

### Code Architecture and Modularity
- **Stack Isolation**: The CDK app (`bin/sahayak.ts`) must instantiate separate stacks for `core`, `api`, `github`, `jira`, and `workers` to decouple deployments and avoid AWS CloudFormation resource limits.
- **Context/Profiles**: `config.ts` must gracefully handle environment propagation (dev vs. prod) based on CDK context variables.
