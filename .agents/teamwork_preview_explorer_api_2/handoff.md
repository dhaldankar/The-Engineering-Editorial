# Handoff: Apps/API Implementation Strategy

## Observation
1. The `apps/api` package is currently empty apart from a placeholder `package.json` (62 bytes).
2. The `packages/db-client` package provides a configured Drizzle ORM client (`createDbClient`) supporting both `proxy` (Postgres TCP) and `data-api` (AWS RDS Data API) modes. It also provides a `withTenant` helper for row-level tenancy filtering.
3. The `infra/lib/core-stack.ts` provisions an Aurora Serverless v2 PostgreSQL cluster with both a Database Proxy (for TCP) and Data API enabled, as well as a Cognito User Pool.
4. The monorepo uses `pnpm` workspaces and `turbo` for builds, meaning `apps/api` must provide a `build` script that outputs to `dist/**` to satisfy `turbo run build`.
5. The requirements specified in `tasks.md` involve API Gateway proxy handlers, Cognito JWT validation, Zod payload validation, and AWS SDK usage for SQS and Step Functions.

## Logic Chain
1. **Build System & Dependencies**: To satisfy `turbo run build`, `apps/api` needs its own build process (e.g., `tsc` or `tsup`). The package requires dependencies for AWS Lambda typings (`@types/aws-lambda`), validation (`zod`), Cognito JWT verification (`jsonwebtoken`, `jwks-rsa`), AWS SDKs (`@aws-sdk/client-sqs`, `@aws-sdk/client-sfn`), and the internal database client (`@engineering-editorial/db-client` as `workspace:*`).
2. **Task 1 (Environment Config)**: A `zod` schema must validate `process.env` globally to crash the Lambda instantly on cold start if required vars (like DB credentials or SQS URLs) are missing.
3. **Tasks 2-4 (HTTP & Middleware)**: Since it's an API Gateway Proxy integration, the HTTP utilities must inject strict CORS headers into every response. The Auth middleware must fetch the JWKS from Cognito using `jwks-rsa` to verify the JWT signature and extract `product_id`. The Body Validator must catch Zod errors and translate them into 400 Bad Request responses.
4. **Task 6 (Repositories)**: Repositories will rely heavily on `db-client`'s `withTenant(table, productId)` to ensure data isolation. The Lambda should use the `data-api` mode or the `proxy` mode for connection pooling to prevent TCP connection exhaustion on cold starts.
5. **Task 7-9 (Handlers & Adapters)**: Handlers will wrap their logic using higher-order functions from the middlewares (e.g., `withAuth`, `withBodyValidation`). The Adapters require robust error handling for transient AWS SDK faults.

## Caveats
1. **DB Connection Mode**: The exact mode (`proxy` vs `data-api`) for `createDbClient` in the API handlers is not strictly defined in the tasks but the infrastructure supports both. Data API is recommended for Lambda to avoid TCP connection overhead.
2. **CORS Management**: While `http.ts` responders are instructed to include CORS headers, we assume standard origin wildcard (`*`) or dynamic origin reflection, which requires exact frontend URL knowledge not present in the current config.
3. **AWS SDK Client Caching**: AWS SDK clients and JWKS clients should be instantiated outside the handler functions (in module scope) to be reused across warm Lambda invocations.

## Conclusion
The `apps/api` package requires setting up a full TypeScript Node project with proper dependencies. The implementation should prioritize Lambda-friendly patterns (e.g., global caching of SDK clients, Fail-Fast environment parsing). 
**Hidden dependencies** identified: `jwks-rsa` for Cognito JWT verification, `@types/aws-lambda` for typing the handlers, and `tsup` or `esbuild` to emit bundled files to `dist/` for `turbo`.
**Testing strategy**: 
- **Unit Tests**: Middleware should be unit-tested using mocked API Gateway events. 
- **Mocked Integration**: Adapters should use `aws-sdk-client-mock`.
- **DB Tests**: Repositories can leverage `db-client` in `proxy` mode pointing to a local Postgres container for accurate schema testing.

## Verification Method
1. Verify `apps/api/package.json` has `build` script and correct dependencies.
2. Run `pnpm install` then `pnpm --filter api run build` to ensure the package builds correctly.
3. Ensure that `turbo run build` succeeds from the workspace root.
4. For JWT and Env fail-fast logic, create a dummy Lambda event test script that executes the handler with missing environment variables and asserts it throws an error immediately.
