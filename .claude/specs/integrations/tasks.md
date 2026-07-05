# Tasks Document

## GitHub Integration

- [ ] 1. Set up GitHub integration environment configuration
  - File: apps/integration-github/src/config/env.ts
  - Implement validation for GitHub App certificates and secrets
  - Purpose: Ensure required secrets are present before app startup
  - _Requirements: 1.1, Non-Functional (Security)_
  - _Prompt: Role: Security Engineer | Task: Create env validation using Zod/Joi for GitHub App ID and Webhook Secret following security best practices | Restrictions: Do not log secrets, fail fast if missing | Success: App refuses to start without valid environment variables_

- [ ] 2. Implement webhook signature verification middleware
  - File: apps/integration-github/src/core/middleware/verify-github-signature.ts
  - Implement HMAC-SHA256 validation against `x-hub-signature-256` header
  - Purpose: Cryptographic validation of incoming hooks
  - _Requirements: 1.3_
  - _Prompt: Role: Backend Developer | Task: Implement GitHub webhook signature verification middleware | Restrictions: Must use timing-safe comparison, reject immediately on failure | Success: Valid signatures pass, invalid or missing signatures return 401 Unauthorized immediately_

- [ ] 3. Create GitHub OAuth adapter
  - File: apps/integration-github/src/adapters/github-oauth-adapter.ts
  - Implement logic to swap temporary grant codes for access tokens
  - Purpose: Interact with GitHub API for authentication
  - _Requirements: 1.1_
  - _Prompt: Role: Integration Developer | Task: Implement OAuth adapter for GitHub code exchange | Restrictions: Use standard HTTP client, handle rate limits and GitHub API errors gracefully | Success: Successfully returns access token from valid setup code_

- [ ] 4. Create installation repository
  - File: apps/integration-github/src/repositories/installation-repository.ts
  - Commits installation tokens to the `config.data_connectors` table
  - Purpose: Securely persist connector configuration
  - _Leverage: packages/db-client_
  - _Requirements: 1.2_
  - _Prompt: Role: Database Developer | Task: Implement installation repository to write to data_connectors | Restrictions: Ensure token is encrypted at rest using versioned keys | Success: Valid tokens are securely written to database_

- [ ] 5. Implement GitHub HTTP handlers
  - Files: apps/integration-github/src/handlers/http/oauth-callback-handler.ts, apps/integration-github/src/handlers/http/webhook-handler.ts
  - Create API entry points for setup redirection and webhook tracking
  - Purpose: Expose integration endpoints
  - _Requirements: 1.1, 1.2, 1.3_
  - _Prompt: Role: API Developer | Task: Implement OAuth callback and webhook handlers orchestrating adapters and middleware | Restrictions: Thin handlers, no business logic, properly route requests | Success: Endpoints securely process OAuth redirects and webhooks_

## Jira Integration

- [ ] 6. Set up Jira integration environment configuration
  - File: apps/integration-jira/src/config/env.ts
  - Implement validation for Atlassian integration client secrets
  - Purpose: Ensure required Atlassian secrets are present
  - _Requirements: 2.1, Non-Functional (Security)_
  - _Prompt: Role: Security Engineer | Task: Create env validation for Atlassian App ID/Secret | Restrictions: Do not log secrets, fail fast | Success: App refuses to start without valid environment variables_

- [ ] 7. Implement Secrets Manager adapter
  - File: apps/integration-jira/src/adapters/secrets-manager-adapter.ts
  - Fetch sensitive keys from AWS Secrets Manager
  - Purpose: Secure secret retrieval at runtime
  - _Requirements: Non-Functional (Security)_
  - _Prompt: Role: Cloud Security Engineer | Task: Implement adapter to fetch Jira credentials from AWS Secrets Manager | Restrictions: Use IAM roles, cache secrets appropriately | Success: Secrets are retrieved securely without being hardcoded_

- [ ] 8. Create Atlassian Auth adapter
  - File: apps/integration-jira/src/adapters/atlassian-auth-adapter.ts
  - Manage 3LO token exchange and refresh procedures
  - Purpose: Handle Atlassian OAuth flows
  - _Requirements: 2.2_
  - _Prompt: Role: Integration Developer | Task: Implement Atlassian 3-legged OAuth adapter | Restrictions: Support both access and refresh token flows, handle expirations | Success: Reliably exchanges codes and refreshes expired tokens_

- [ ] 9. Create Tenant Connector repository
  - File: apps/integration-jira/src/repositories/tenant-connector-repository.ts
  - Writes active connection configurations for Jira
  - Purpose: Securely persist Atlassian tokens
  - _Leverage: packages/db-client_
  - _Requirements: 2.3_
  - _Prompt: Role: Database Developer | Task: Implement tenant connector repository for Jira tokens | Restrictions: Ensure encryption at rest | Success: Tokens are securely persisted and retrievable_

- [ ] 10. Implement Jira HTTP handlers
  - Files: apps/integration-jira/src/handlers/http/authorize-redirect-handler.ts, apps/integration-jira/src/handlers/http/oauth-callback-handler.ts
  - Create endpoints for CSRF-protected setup and callback verification
  - Purpose: Orchestrate Jira OAuth flow
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: API Developer | Task: Implement authorization redirect and callback handlers | Restrictions: Enforce state validation for CSRF protection | Success: Successfully guides user through OAuth flow securely_
