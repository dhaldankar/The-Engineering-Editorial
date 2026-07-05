# Implementation Strategy & Findings: GitHub Integration (Tasks 1-5)

## Overview
Investigation of `apps/integration-github` and `packages/db-client` is complete. The GitHub integration app is currently an empty package, and `db-client` provides the necessary Drizzle ORM schema for persisting tokens. The following report details the proposed implementation strategy.

## 1. Observation
- **Scope & Tasks**: `SCOPE.md` outlines the GitHub Integration layer. Tasks 1-5 in `tasks.md` require env validation, webhook signature verification, OAuth token exchange, database persistence, and HTTP handlers.
- **`apps/integration-github`**: Currently contains only a basic `package.json`. No source files, dependencies, or build scripts are present.
- **`packages/db-client`**: Exposes the package `@engineering-editorial/db-client`. The schema `packages/db-client/src/schema/config.ts` includes the `dataConnectors` table, which is perfectly aligned with Task 4 requirements. It has fields: `id`, `productId`, `repositoryId`, `connectorType` (`'github'`), `credentialsCiphertext`, and `keyVersion`.
- **Global Search**: No existing cryptographic or encryption package was found in the workspace (`packages/`), meaning encryption at rest will need to be implemented within the integration app or as a new shared utility.

## 2. Logic Chain & Implementation Strategy

Since the app is empty, the implementer must first initialize it as a Node TypeScript project with a web framework (like Express or Fastify) and add `"@engineering-editorial/db-client": "workspace:*"` to its dependencies.

### Task 1: Environment Configuration (`apps/integration-github/src/config/env.ts`)
- **Strategy**: Use `zod` to define a strict schema for required variables: `GITHUB_APP_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET`, `DB_CONNECTION_STRING`, and an encryption key (e.g., `ENCRYPTION_KEY_V1`).
- **Action**: Parse `process.env`. If it fails, throw an error immediately to prevent app startup (fail-fast), ensuring sensitive values are omitted from the log output. Export the validated config object.

### Task 2: Webhook Signature Middleware (`apps/integration-github/src/core/middleware/verify-github-signature.ts`)
- **Strategy**: Create an Express-style middleware `(req, res, next)`.
- **Action**: Read the `x-hub-signature-256` header. Use Node's built-in `crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)` to hash the raw request body (`req.rawBody` or equivalent). Use `crypto.timingSafeEqual()` to compare the computed hash with the header. If they mismatch, return `401 Unauthorized` immediately.

### Task 3: GitHub OAuth Adapter (`apps/integration-github/src/adapters/github-oauth-adapter.ts`)
- **Strategy**: Create a class or function to wrap the GitHub API.
- **Action**: Use the native `fetch` API to make a `POST` request to `https://github.com/login/oauth/access_token`. Pass `client_id`, `client_secret`, and `code` as JSON payload. Set `Accept: application/json`. Handle rate limits and non-200 responses by throwing custom errors. Return the access token.

### Task 4: Installation Repository (`apps/integration-github/src/repositories/installation-repository.ts`)
- **Strategy**: Implement the database persistence layer using `@engineering-editorial/db-client`.
- **Action**: 
  - Import `createDbClient` and the `dataConnectors` schema.
  - Implement a simple `encrypt` function using Node's `crypto` (e.g., `aes-256-gcm`) utilizing the environment's `ENCRYPTION_KEY_V1`.
  - Store the encrypted token in `credentialsCiphertext` and set `keyVersion: 1`. 
  - Insert or update the record in the `dataConnectors` table linked to the appropriate `productId`.

### Task 5: HTTP Handlers (`apps/integration-github/src/handlers/http/`)
- **Strategy**: Thin controller layer orchestrating the core logic.
- **Action (`oauth-callback-handler.ts`)**: Extract `code` and `state` (which should contain the `productId`) from the query string. Call the OAuth adapter to exchange the code for a token, then call the installation repository to persist it. Redirect to a success page.
- **Action (`webhook-handler.ts`)**: Receive the verified payload (already checked by the middleware). Route the payload to specific domain event processors based on the `x-github-event` header (e.g., `installation`, `push`).

## 3. Caveats
- **Web Framework Choice**: The exact web framework is not specified. Express is assumed due to the "middleware" terminology in Task 2. The implementer will need to configure `req.rawBody` buffering, which is crucial for HMAC verification.
- **Encryption**: Since no centralized `packages/crypto` exists, the encryption utility is assumed to be implemented locally for Task 4. If a standard encryption mechanism is expected across integrations, this might need extraction later.
- **OAuth State**: Obtaining `productId` during the callback implies it must be passed via the `state` parameter during the initial OAuth redirect (not covered in Tasks 1-5).

## 4. Conclusion
The implementation can proceed strictly within `apps/integration-github`. The primary focus will be on secure configuration management with Zod, cryptographic verification with Node `crypto`, API communication with `fetch`, and database interactions using the existing `@engineering-editorial/db-client`. No blocking dependencies exist.

## 5. Verification Method
- **Static**: Verify `apps/integration-github/package.json` has `typescript`, `zod`, `express` (or similar), and `@engineering-editorial/db-client`.
- **Build**: Run `pnpm install` and `turbo run build` at the root. It must compile without TypeScript errors.
- **Test**: The implementer should write unit tests testing `verify-github-signature` (with valid/invalid signatures) and the Zod environment validation (ensuring it fails on missing secrets).
