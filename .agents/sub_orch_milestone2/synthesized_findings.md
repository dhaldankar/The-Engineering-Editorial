# Synthesized Explorer Findings: GitHub Integration (Tasks 1-5)

## Consensus
All 3 Explorers agree on the following implementation strategy:
- `apps/integration-github` is an empty package (only `package.json`). It needs to be configured as a TypeScript Node.js project. We should assume Express as the HTTP framework since Task 2 mentions "middleware".
- Dependencies to add: `zod`, `express`, `@types/express`, and workspace dependency `@engineering-editorial/db-client`.

### Task 1: Environment Validation (`src/config/env.ts`)
- Use `zod` to validate `GITHUB_APP_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET`, and `ENCRYPTION_KEY_V1`.
- Fail fast if secrets are missing. Do not log the secrets. Export the validated object.

### Task 2: Webhook Signature Middleware (`src/core/middleware/verify-github-signature.ts`)
- Read the `x-hub-signature-256` header.
- Compute HMAC-SHA256 of the raw request body using `GITHUB_WEBHOOK_SECRET`.
- Compare using `crypto.timingSafeEqual()`. Return `401 Unauthorized` on mismatch.
- *Crucial Details*: Requires access to the raw body in Express (e.g., using `express.json({ verify: ... })` or a custom buffer).

### Task 3: GitHub OAuth Adapter (`src/adapters/github-oauth-adapter.ts`)
- Use native `fetch` API.
- POST to `https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, and `code`.
- Set `Accept: application/json`. Extract and return `access_token`.
- Throw custom errors on rate limits or API failures.

### Task 4: Installation Repository (`src/repositories/installation-repository.ts`)
- Use `@engineering-editorial/db-client` to access the `dataConnectors` table.
- Implement `aes-256-gcm` encryption using Node's `crypto` module with `ENCRYPTION_KEY_V1` to encrypt the `access_token`.
- Insert into `data_connectors`: `connectorType: 'github'`, `credentialsCiphertext: <encrypted_token>`, `keyVersion: 1`.

### Task 5: HTTP Handlers (`src/handlers/http/`)
- `oauth-callback-handler.ts`: Extracts `code` (and `state` for `productId`). Calls OAuth Adapter -> Calls Installation Repository -> Redirects.
- `webhook-handler.ts`: Routes verified webhook payloads based on `x-github-event`. Keep them thin.

## Gaps & Caveats
- **Raw Body in Express**: The Worker MUST ensure that `req.rawBody` or equivalent is populated before the signature middleware runs, otherwise HMAC calculation will fail.
- **Project Setup**: Worker needs to configure `tsconfig.json` and basic Express wiring since the folder is empty.
