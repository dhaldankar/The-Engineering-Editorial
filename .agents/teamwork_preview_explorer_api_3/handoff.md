# Handoff: Implementation Strategy for apps/api Tasks 1-9

## 1. Observation
- `apps/api` currently only contains a stub `package.json` with no dependencies or build scripts. `tsconfig.json` is missing.
- `packages/db-client` exports `createDbClient`, `schema` (including `factsSchema`, `configSchema`), and a `withTenant` utility (`src/tenancy.ts`) which expects a `productId`.
- Task 1 requires Zod validation for DB URIs, SQS Queue URLs, and Cognito Pools.
- Task 3 requires Cognito JWT verification and extracting `product_id`.
- Tasks 5, 6, 8, 9 involve using repositories to query Postgres via Drizzle, using strict DTOs.
- Task 7 requires pushing to SQS and triggering Step Functions.

## 2. Logic Chain
1. **Package Setup**: Because `apps/api` is empty, the implementer must first initialize `package.json` with `dependencies`: `zod`, `aws-jwt-verify` (for Cognito JWTs), `@aws-sdk/client-sqs`, `@aws-sdk/client-sfn`, `@engineering-editorial/db-client`. `devDependencies`: `typescript`, `@types/aws-lambda`, `@types/node`. A `tsconfig.json` is needed. Add a `build` script (e.g., `"build": "tsc"`) to satisfy `turbo run build`.
2. **Environment & Zod (T1, T4, T5)**:
   - `env.ts` should export a validated Zod schema. Accessing missing vars should crash the Lambda fast (`process.env` parsing).
   - `validate-body.ts` middleware needs to intercept API Gateway events, parse `event.body` with Zod, and return 400 early on failure.
3. **Cognito Auth Integration (T3)**:
   - The most robust way to verify Cognito JWTs in Node without heavy custom JWKS logic is using `aws-jwt-verify`.
   - The middleware should extract the `Authorization` header, verify the JWT, and inject claims (specifically `product_id` mapped from a custom attribute like `custom:product_id` or `tenant_id`) into the Lambda `event` context (e.g., `event.requestContext.authorizer`).
4. **DB Repositories (T6)**:
   - Queries must use `withTenant(schema.metricFact, productId)` to ensure tenant isolation.
5. **AWS Adapters (T7)**:
   - `sqs-adapter.ts`: Use `SQSClient` and `SendMessageCommand` from `@aws-sdk/client-sqs`.
   - `stepfunctions-adapter.ts`: Use `SFNClient` and `StartExecutionCommand` from `@aws-sdk/client-sfn`.
   - Both must gracefully handle and log transient AWS SDK errors.
6. **HTTP Handlers (T8, T9)**:
   - Implementers should use `@types/aws-lambda` for `APIGatewayProxyEvent` and `APIGatewayProxyResult`.
   - Async job handlers (T9) must return `202 Accepted` using the utilities from `core/http.ts`.

## 3. Caveats
- `apps/api` has no existing build tool like `esbuild` or `tsup`. Using plain `tsc` is the simplest path to satisfy `turbo run build`, but if bundlers are standard in this repo, they could be used.
- The exact Cognito custom claim name for `product_id` isn't specified in `tasks.md`. The implementer should assume a standard attribute (e.g., `custom:product_id`) and document it.
- Middleware design in Node.js for Lambda is typically handled by wrapping the handler function (e.g., `withAuth(withBodyValidation(handler))`).

## 4. Conclusion
The implementation of Tasks 1-9 requires first bootstrapping the `apps/api` package with standard AWS Lambda and TypeScript tooling. The architecture cleanly separates concerns: `env.ts` for fail-fast config, middlewares for auth/validation, adapters for AWS services, and repositories leveraging `packages/db-client` for tenant-safe DB queries. The implementer must proceed file-by-file as spec'd, ensuring all types align with `APIGatewayProxyEvent`.

## 5. Verification Method
- **Static Analysis**: `cd apps/api && pnpm install && pnpm tsc --noEmit`
- **Build**: `pnpm turbo run build --filter=api`
- **Inspection**: Review `apps/api/src/adapters` to ensure `SQSClient` and `SFNClient` are properly instantiated and error-handled. Review `apps/api/src/repositories` to ensure `withTenant` is used on all queries.
