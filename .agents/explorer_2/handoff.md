# Handoff Report: GitHub Integration (Tasks 1-5)

## 1. Observation
- The `apps/integration-github` directory currently contains only a minimal `package.json`. No source files or configurations have been implemented yet for Tasks 1-5.
- The `packages/db-client` directory contains a Drizzle ORM database client setup.
- `packages/db-client/src/schema/config.ts` includes the `data_connectors` table schema, which is required for Task 4. The table has fields `id`, `productId`, `repositoryId`, `connectorType`, `credentialsCiphertext`, `keyVersion`, `createdAt`, and `updatedAt`.
- The `.claude/specs/integrations/tasks.md` outlines the requirements for Tasks 1-5, focusing on setting up the environment configuration, webhook verification, OAuth adapter, installation repository, and HTTP handlers.

## 2. Logic Chain
1. **Task 1 (Environment Config):** Since `apps/integration-github` is a blank slate, we need to create `src/config/env.ts`. `zod` should be used to define and validate a schema for `GITHUB_APP_ID`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. If validation fails, the application should throw a synchronous error during initialization without printing the values.
2. **Task 2 (Webhook Verification Middleware):** Needs to be built in `src/core/middleware/verify-github-signature.ts`. It should compute the HMAC-SHA256 signature using `GITHUB_WEBHOOK_SECRET` and compare it against `x-hub-signature-256` using Node's `crypto.timingSafeEqual`. This prevents timing attacks and rejects unauthorized hooks immediately (401 Unauthorized).
3. **Task 3 (GitHub OAuth Adapter):** Needs `src/adapters/github-oauth-adapter.ts`. Using the native `fetch` API, this adapter will exchange the OAuth code for an access token via the `https://github.com/login/oauth/access_token` endpoint. Error handling should check for HTTP errors (e.g., rate limits, API failures).
4. **Task 4 (Installation Repository):** Needs `src/repositories/installation-repository.ts`. The repository will depend on `@engineering-editorial/db-client`. It will perform an `INSERT` into the `data_connectors` table using Drizzle. Before inserting, the access token must be encrypted using `crypto` (`aes-256-gcm`) and a versioned encryption key. The resulting ciphertext and `keyVersion` will be stored securely.
5. **Task 5 (HTTP Handlers):** Requires two files in `src/handlers/http/`:
    - `oauth-callback-handler.ts`: Extracts the `code`, calls the OAuth adapter (Task 3), then uses the Installation repository (Task 4) to securely persist the token. Redirects the user on completion.
    - `webhook-handler.ts`: Validates incoming requests using the signature middleware (Task 2) and routes the GitHub events (e.g., `pull_request`, `push`) to the appropriate domain logic. Both should be thin and framework-agnostic or aligned with the team's chosen HTTP framework.

## 3. Caveats
- **HTTP Framework:** The workspace does not specify an HTTP framework for `apps/integration-github` yet. The handlers and middleware implementation will depend on whether Express, Fastify, Hono, or another framework is chosen.
- **Encryption Keys:** Task 4 requires encrypting the access token, meaning an encryption key management strategy must be in place. We assume the environment will provide something like `ENCRYPTION_KEY_V1`.
- **Database Instantiation:** The handlers will need a configured database client instance from `db-client`. The configuration details for Drizzle (`mode`, `connectionString`, or `secretArn`) must be injected correctly in the app's entry point.

## 4. Conclusion
The implementation of Tasks 1-5 will proceed in a new Node.js service structure within `apps/integration-github`. 
- **Task 1** sets the foundation by ensuring secure startup configuration.
- **Task 2** and **Task 5** handle the inbound routing and security of GitHub webhooks.
- **Task 3** and **Task 4** handle OAuth token acquisition and secure persistence leveraging the existing `data_connectors` schema in `packages/db-client`.

## 5. Verification Method
- **Static Analysis:** Verify the presence of the 5 new files in `apps/integration-github/src`. Check that `zod` and `@engineering-editorial/db-client` are listed as dependencies in `apps/integration-github/package.json`.
- **Build/Test:** Run `pnpm install` and then `pnpm --filter integration-github run build`. The TypeScript compiler should verify type safety across the new files, particularly the correct usage of the `dataConnectors` Drizzle schema.
- **Unit Testing:** Implement unit tests for `verify-github-signature.ts` verifying that mock valid payloads pass and invalid ones fail.
