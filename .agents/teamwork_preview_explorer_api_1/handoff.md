# Handoff Report: Implementation Strategy for apps/api

## 1. Observation
- `apps/api` is currently an empty shell with a bare `package.json`. It requires configuration and dependencies for `turbo run build` to succeed.
- `turbo.json` looks for a `build` script in packages to trigger the build.
- `packages/db-client` exports schema tables (e.g., `metricFact`, `metricRun`, `products`, `repositories`) and a database client factory `createDbClient`, along with a tenancy helper `withTenant` in `tenancy.ts`.
- `SCOPE.md` and `tasks.md` define 9 specific tasks for building the API app, encompassing setup, middlwares, DTOs, Repositories, Adapters, and HTTP Handlers.

## 2. Logic Chain
To implement Tasks 1-9 cleanly and ensure a successful turborepo build:
1. **Package Setup**: 
   - Update `apps/api/package.json` to include `"scripts": { "build": "tsc" }` and necessary dependencies: `@engineering-editorial/db-client` (workspace), `zod`, `aws-lambda`, `@types/aws-lambda`, `@aws-sdk/client-sqs`, `@aws-sdk/client-sfn`, and a JWT library like `jsonwebtoken` or `jose`.
   - Add a `tsconfig.json` extending a base or explicitly configured for Node/Lambda to allow `tsc` to compile cleanly into `dist/`.
2. **Task 1 (Env Setup)**: Create `apps/api/src/config/env.ts` exporting a parsed/validated environment config using `zod`. This provides fail-fast guarantees on boot.
3. **Task 2 (HTTP Utils)**: Create `apps/api/src/core/http.ts` exposing responder functions (`ok`, `accepted`, `badRequest`, etc.) returning `APIGatewayProxyResult` with proper CORS headers.
4. **Task 3 & 4 (Middleware)**: Implement Higher-Order Functions (HOFs) in `apps/api/src/core/middleware/`. `auth-middleware.ts` should verify the Cognito JWT from the `Authorization` header and inject `product_id`. `validate-body.ts` should parse and validate `event.body` against a Zod schema, returning `badRequest` on failure.
5. **Task 5 (DTOs)**: Create Zod schemas in `apps/api/src/dto/` for Dashboard Metrics and Sync Jobs to type-check API boundaries.
6. **Task 6 (Repositories)**: In `apps/api/src/repositories/`, implement functions importing `dbClient` and leveraging `withTenant` from `db-client` to securely query `metricFact` and config schemas.
7. **Task 7 (Adapters)**: Create `sqs-adapter.ts` and `stepfunctions-adapter.ts` wrapping AWS SDK clients to push messages/trigger machines.
8. **Tasks 8 & 9 (Handlers)**: Implement the APIGateway handlers in `apps/api/src/handlers/http/` by combining the middlewares (auth, body-validator) and delegating business logic to repositories/adapters. The handler functions should be exported to be invoked by AWS Lambda.

## 3. Caveats
- Auth middleware validation is mentioned as verifying Cognito JWT claims. You may need to download the JWKS from Cognito or use a library that handles it. For a pure types/build check, dummying the exact signature validation or using a simple symmetric check is sufficient as long as it handles the claims.
- The `tsconfig.json` needs to be set up to target ES2022+ or equivalent.
- There is no infrastructure-as-code included in the tasks, just the Lambda function handlers.

## 4. Conclusion
The API app requires a foundational `package.json` and `tsconfig.json` to integrate with `turbo`. Implementing the 9 tasks via clean separation of concerns (Middleware -> Handlers -> Repositories/Adapters) using the provided `db-client` will fulfill all functional requirements and build requirements.

## 5. Verification Method
- **Command**: Run `turbo run build --filter=api` to verify the build succeeds.
- **Inspect**: Ensure `dist/` is generated inside `apps/api` without TypeScript compilation errors.
