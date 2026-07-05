# Observation
- The milestone tasks are defined in `.claude/specs/workers/tasks.md` and the scope is outlined in `.agents/sub_orch_workers/SCOPE.md`.
- `apps/workers` is mostly uninitialized. The directory only contains a minimal `package.json` (`"name": "workers", "version": "0.0.0", "private": true`). There is no `src` folder, `tsconfig.json`, or build configuration.
- The project is a monorepo using pnpm workspaces (`pnpm-workspace.yaml` includes `apps/*` and `packages/*`).
- Other packages like `@engineering-editorial/core-types` are properly configured with `"type": "module"` / ESM configurations, `zod` as a dependency, and `typescript` as a devDependency.

# Logic Chain
1. Because `apps/workers` is virtually empty, before Tasks 1-3 can be implemented, the package must be initialized properly with dependencies and TypeScript configuration matching the workspace standard.
2. **Task 1 (Environment Configuration)**: The goal is to validate Bedrock model definitions and DB environment configurations. This should be implemented using `zod` to fail fast during Lambda cold start. We need `zod` added to dependencies.
3. **Task 2 (Error Taxonomy and Pipeline State DTOs)**: Requires custom error classes mapping to Step Functions (SFN) retry policies (e.g., `TransientError`, `TerminalError`). By explicitly setting the error `name`, SFN can catch them. Zod schemas must also be defined for SFN state chunks.
4. **Task 3 (Pipeline Core Utilities)**: Requires a wrapper for the Step Function `Map` context. This means creating utilities to parse and standardize the execution context `$$.Map` parameters and state input.

# Caveats
- I did not investigate the specific environment variable names used by `@engineering-editorial/db-client` (e.g., `DATABASE_URL` vs separate host/port vars), so the env validation schema might need adjustments based on the exact DB client implementation.
- The precise structure of Step Function payloads is assumed to be generic at this stage since specific AWS infrastructure is not yet checked.

# Conclusion
The following step-by-step fix strategy should be executed for Milestone 1:

**Step 0: Package Setup**
1. Update `apps/workers/package.json` with standard workspace fields (e.g., `"name": "@engineering-editorial/workers"`, scripts for build/lint).
2. Add dependencies: `zod` and devDependencies: `typescript`, `@types/node`.
3. Create `apps/workers/tsconfig.json` mirroring `packages/core-types/tsconfig.json`.

**Step 1: Task 1 - Env Configuration**
1. Create `apps/workers/src/config/env.ts`.
2. Define `workerEnvSchema` using `zod` (validating AWS/Bedrock variables and Database credentials).
3. Export an `env` object initialized by `workerEnvSchema.parse(process.env)`.

**Step 2: Task 2 - Error Taxonomy & DTOs**
1. Create `apps/workers/src/core/errors.ts`. Export `TransientError` and `TerminalError` classes extending `Error`, explicitly assigning `this.name = this.constructor.name`.
2. Create `apps/workers/src/dto/pipeline-payloads.ts`. Define and export Zod schemas (`StateChunkSchema`) and their inferred types for SFN inputs/outputs.

**Step 3: Task 3 - Pipeline Core Utilities**
1. Create `apps/workers/src/core/pipeline.ts`.
2. Implement utility functions (e.g., `extractMapContext(event: any)`) to extract and validate SFN map execution parameters robustly.

# Verification Method
1. Run `pnpm install` in the root to ensure workspace links are updated.
2. Run `pnpm --filter @engineering-editorial/workers build` (or `tsc --noEmit`) to verify that the TypeScript compilation passes without errors.
3. Check that importing `apps/workers/src/config/env.ts` programmatically correctly throws a Zod error if the required environment variables are omitted.
