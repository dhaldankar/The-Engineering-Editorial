# Requirements Document

## Introduction

The `app/integration-*` sub-apps (specifically `integration-github` and `integration-jira`) manage the secure onboarding and authentication of external data sources for Engineering Insights. Their purpose is to safely conduct OAuth handshakes, process webhook events, and persist encrypted tenant tokens, acting as the security and boundary layer between third-party platforms and our internal data architecture.

## Alignment with Product Vision

This feature supports the core product vision by enabling tenants to securely connect their execution (GitHub) and planning (Jira) environments. It ensures that tenant API tokens are strictly isolated, securely encrypted at rest, and never exposed to the frontend, fulfilling the multi-tenant SaaS security commitments outlined in the architecture.

## Requirements

### Requirement 1: GitHub App Installation & Webhooks

**User Story:** As a Tenant Admin, I want to install the Engineering Insights GitHub App so that my repository activity can be analyzed securely.

#### Acceptance Criteria

1. WHEN a GitHub installation setup redirect lands on `oauth-callback-handler` THEN the system SHALL swap the temporary grant code for an access token.
2. WHEN the system receives a token THEN it SHALL securely commit the installation token to the `data_connectors` configuration via `installation-repository`.
3. WHEN a webhook payload is received THEN the `verify-github-signature` middleware SHALL cryptographically validate the incoming hook against the GitHub App secret before processing.

### Requirement 2: Jira 3LO OAuth Integration

**User Story:** As a Tenant Admin, I want to authorize Jira access via Atlassian 3LO (3-legged OAuth) so that my team's planning data can be ingested.

#### Acceptance Criteria

1. WHEN the admin initiates Jira setup THEN the `authorize-redirect-handler` SHALL generate and store a securely signed authentication state to prevent CSRF.
2. WHEN the Atlassian OAuth callback is received THEN the `oauth-callback-handler` SHALL verify the state and the `atlassian-auth-adapter` SHALL exchange the grant for access/refresh tokens.
3. WHEN Jira credentials need to be stored THEN the `tenant-connector-repository` SHALL securely encrypt the tokens at rest using versioned key columns in Aurora.

## Non-Functional Requirements

### Code Architecture and Modularity
- **Isolation Principle**: Both integration apps must remain completely separate deployables to limit their security blast radius, isolated from the main API and frontend.
- **Dependency Management**: They must only depend on approved internal packages (`db-client`, `core-types`, `connectors`) and not leak business logic into HTTP handlers.

### Security
- **App Credentials**: Application-level secrets (GitHub App private key, Jira client secret) must be retrieved from AWS Secrets Manager via `secrets-manager-adapter` and validated via `env.ts`.
- **Tenant Tokens**: All tenant-specific tokens must be encrypted at rest before hitting the database.
- **Webhook Integrity**: All incoming hooks must enforce cryptographic signature validation.

### Reliability
- Must safely handle temporary code exchange failures and gracefully report errors without leaking stack traces or partial credentials.
