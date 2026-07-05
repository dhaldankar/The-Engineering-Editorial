# Handoff: Workers Milestone 1 (Tasks 1-3)

## Observation
- `apps/workers` currently only contains a basic `package.json` with `{"name": "workers", "version": "0.0.0", "private": true}`.
- There is no `src` directory or `tsconfig.json` present in `apps/workers`.
- The task requires setting up `src/config/env.ts`, `src/core/errors.ts`, `src/dto/pipeline-payloads.ts`, and `src/core/pipeline.ts`.
- `package.json` lacks necessary dependencies to implement Zod validation and basic TypeScript definitions.

## Logic Chain
1. **Prerequisites**: Before implementing the tasks, `apps/workers/package.json` must be updated to include `zod` as a dependency, and `typescript` as a dev dependency. A `tsconfig.json` must also be added.
2. **Task 1 (Config Validation)**: `src/config/env.ts` needs a Zod schema to parse `process.env`. It should validate keys like `BEDROCK_MODEL_ID`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, etc. Exporting the parsed configuration object ensures the lambda fails quickly if misconfigured.
3. **Task 2 (Errors & DTOs)**: 
   - `src/core/errors.ts` should export `TransientError` and `TerminalError` base classes extending `Error`. SFN Catch/Retry configurations will match on `error.name`. Specific errors like `RateLimitError` should extend `TransientError`.
   - `src/dto/pipeline-payloads.ts` should define Zod schemas for SFN Map State chunks (e.g., `const PipelineChunkSchema = z.object({ chunkIndex: z.number(), items: z.array(z.any()) })`).
4. **Task 3 (Pipeline Core Utilities)**: `src/core/pipeline.ts` requires utility functions to parse Step Function Context objects (the `$$` object) and extract execution context/chunk bounds (e.g. `extractMapContext(sfnContext)`).

## Caveats
- Exact environment variable names for Bedrock and DB are assumed based on standard conventions (e.g., `BEDROCK_MODEL_ID`, `DB_HOST`). Adjust if the actual names differ.
- The `z.any()` in the pipeline chunk payload should ideally be replaced with specific types when the Adapters are implemented (Tasks 4-5), but works for the core setup phase.

## Conclusion
Implementers should follow these steps:
1. Update `apps/workers/package.json` to include `"dependencies": { "zod": "^3.22.4" }` and necessary devDependencies.
2. Add a `tsconfig.json` to `apps/workers`.
3. Create `src/config/env.ts` with `zod` environment validation.
4. Create `src/core/errors.ts` defining `TransientError`, `TerminalError`, and `RateLimitError`.
5. Create `src/dto/pipeline-payloads.ts` with Zod schemas for pipeline state payloads.
6. Create `src/core/pipeline.ts` with SFN context wrapper functions.

## Verification Method
1. Run `pnpm install` in the workspace root.
2. Ensure `tsc --noEmit` runs successfully inside `apps/workers`.
3. Inspect `src/config/env.ts` to ensure `process.env` is correctly validated and fails fast on invalid configs.
