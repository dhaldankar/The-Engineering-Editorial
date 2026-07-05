# Requirements Document

## Introduction

The `workers/` sub-app constitutes the Asynchronous Pipeline Plane of Engineering Insights. It is composed of AWS Lambda functions orchestrated by AWS Step Functions and SQS. This app manages the heavy, long-running processing tasks: ingesting data, normalizing it into a canonical schema, enriching data using LLMs (Amazon Bedrock), and aggregating metrics via the harness.

## Alignment with Product Vision

By shifting complex and time-consuming data processing into a resilient, async pipeline, the platform ensures that the frontend API plane remains incredibly fast. The `workers` app fulfills the core value proposition of turning raw external data into pre-computed actionable insights in the medallion data architecture (Bronze, Silver, Gold).

## Requirements

### Requirement 1: Asynchronous Ingestion (Bronze)

**User Story:** As the system, I want to ingest data from third-party tools (GitHub, Jira) asynchronously so that I can store raw payloads as an immutable ledger.

#### Acceptance Criteria
1. WHEN the SQS intake handler is triggered THEN it SHALL initiate an ingestion Step Function execution.
2. WHEN the `ingest-task-handler` runs THEN it SHALL stream raw JSON payloads to S3 via the `s3-bronze-repository`.

### Requirement 2: Normalization (Silver)

**User Story:** As the system, I want to normalize raw JSON payloads into canonical domain entities so that data from disparate sources can be linked.

#### Acceptance Criteria
1. WHEN the `normalize-task-handler` runs THEN it SHALL parse Bronze data and upsert into the `core` namespace via `core-entities-repository`.
2. IF an identity cannot be resolved THEN the system SHALL log it to the unresolved identities table rather than dropping it.

### Requirement 3: LLM Enrichment

**User Story:** As the system, I want to enrich review comments with sentiment and actionable classification using an LLM.

#### Acceptance Criteria
1. WHEN the `enrich-task-handler` runs THEN it SHALL chunk data using Step Functions `Map` context and call Amazon Bedrock via the `bedrock-adapter`.
2. IF Bedrock returns a rate-limit error THEN the system SHALL categorize it properly for SFN retries using the defined error taxonomy.

### Requirement 4: Metric Aggregation (Gold)

**User Story:** As the system, I want to compute facts and metrics across predefined grains so that dashboards can load instantly.

#### Acceptance Criteria
1. WHEN the `aggregate-task-handler` runs THEN the `metric-executor-service` SHALL run SQL queries in DAG dependency order.
2. WHEN inserting computed metrics THEN the `facts-repository` SHALL use `grain_key` based unique conflict resolution to ensure idempotency.

## Non-Functional Requirements

### Architectural Constraints
- **15-Minute Ceiling**: No pipeline stage may perform a monolithic pass over unbounded data. Work must be chunked and coordinated using Step Function `Map` states.
- **No HTTP Parsing**: Event handlers must solely process SQS and SFN event structures, avoiding any HTTP-specific parsing or API Gateway dependencies.

### Error Handling
- **SFN Error Retries**: An explicit error taxonomy must be used so Step Functions can correctly apply backoff and retry policies for transient faults vs. terminal errors.
