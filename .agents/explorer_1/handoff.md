# Handoff Report: GitHub Integration (Tasks 1-5)

**Summary:** `apps/integration-github` is currently empty except for `package.json`. The implementation for Tasks 1-5 will be a greenfield effort, heavily leveraging standard Node.js built-ins (`crypto`, `fetch`) and the local `@engineering-editorial/db-client` for secure database operations.

## 1. Observation
- `apps/integration-github` exists but contains only `package.json`. There is no pre-existing framework or boilerplate code.
- `packages/db-client/src/schema/config.ts` defines a `data_connectors` table:
  - Fields include `id`, `productId`, `connectorType`, `credentialsCiphertext`, and `keyVersion`.
- `packages/db-client/src/index.ts` exports a `createDbClient` function which instantiates the Drizzle ORM client.
- `tasks.md` outlines a sequence of building blocks: config validation (Task 1), middleware (Task 2), OAuth adapter (Task 3), DB repository (Task 4), and HTTP handlers (Task 5).

## 2. Logic Chain
- **Task 1: Environment Validation (`src/config/env.ts`)**
  - *Logic:* Since we must fail fast and not log secrets, we should use a library like `zod`. We must validate `GITHUB_APP_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET`, and a secret key for database encryption (e.g., `ENCRYPTION_KEY_V1`).
- **Task 2: Webhook Middleware (`src/core/middleware/verify-github-signature.ts`)**
  - *Logic:* We must use `crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)` on the raw request body. The resulting digest must be compared with the `x-hub-signature-256` header using `crypto.timingSafeEqual` to prevent timing attacks.
- **Task 3: OAuth Adapter (`src/adapters/github-oauth-adapter.ts`)**
  - *Logic:* An adapter class/function that takes a GitHub temporary `code` and POSTs it to `https://github.com/login/oauth/access_token`. It returns the `access_token` and handles potential API errors.
- **Task 4: Installation Repository (`src/repositories/installation-repository.ts`)**
  - *Logic:* Requires the `@engineering-editorial/db-client` instance. Before inserting into `data_connectors`, the `access_token` must be encrypted using `crypto.createCipheriv` with `aes-256-gcm` (authenticated encryption) using the `ENCRYPTION_KEY_V1`. The IV, auth tag, and ciphertext should be concatenated and stored in `credentialsCiphertext`, with `keyVersion` set to `1`.
- **Task 5: HTTP Handlers (`src/handlers/http/...`)**
  - *Logic:* `oauth-callback-handler.ts` will receive the callback, call the OAuth Adapter, then the Installation Repository, and finally redirect the user. `webhook-handler.ts` will receive validated webhook payloads (guarded by Task 2 middleware) and process or queue them.

## 3. Caveats
- **Framework Choice:** As the repository is currently empty, the specific HTTP framework (Express, Fastify, Hono, etc.) isn't initialized. The implementation should ideally be kept as framework-agnostic as possible, or default to Express if that is the organization's standard.
- **Encryption Key Sourcing:** The `ENCRYPTION_KEY_V1` must be provided via environment variables as a securely generated 32-byte hex/base64 string for AES-256.

## 4. Conclusion
The implementer can proceed with building the `apps/integration-github/src/` structure.
- Install necessary dependencies (`zod`, `express` (if applicable), and workspace dependency `@engineering-editorial/db-client`) in `apps/integration-github/package.json`.
- Implement each file exactly as designated by the paths in `tasks.md`.

## 5. Verification Method
- Code compilation: Run `npm run build` or `tsc` inside `apps/integration-github` to ensure type-safety.
- Run tests for `verify-github-signature.ts` verifying that tampering with either the payload or the signature results in immediate rejection.
- Run tests for `installation-repository.ts` ensuring that the decrypted ciphertext matches the original token.
