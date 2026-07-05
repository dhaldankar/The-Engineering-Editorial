# Milestone 1 (Core Setup, Tasks 1-3) Investigation Report

## 1. Observation
- The `apps/workers` folder is currently empty except for `package.json` (which only contains basic name/version/private fields).
- Source directories like `src/config`, `src/core`, `src/dto` do not exist.
- Required dependencies like `zod` and `typescript` have not yet been explicitly configured in `apps/workers/package.json`.
- Task 1 requires validating DB env configs and Bedrock model definitions without redundant loads (fail fast).
- Task 2 requires specific error names aligning with AWS SFN Catch/Retry blocks, and Zod schemas for Step Function state chunks.
- Task 3 requires wrappers to extract SFN Map state execution contexts securely.

## 2. Logic Chain
1. **Initial Setup Needed**: Since the `apps/workers` package is just an empty shell, before fulfilling Tasks 1-3, standard package scaffolding (adding `zod`, TS configs) must be performed. 
2. **Task 1 Execution**: We need a singleton configuration module in `apps/workers/src/config/env.ts` exporting a statically validated environment object using Zod (e.g., parsing `process.env`). This satisfies the "fail fast" and "no redundant loads" requirements.
3. **Task 2 Execution**: SFN retries depend on explicit `Error.name` string matching. Therefore, transient errors (e.g., `RateLimitError`) and terminal errors (e.g., `ValidationError`) must have their `name` property explicitly set in their constructor to match standard SFN Retry/Catch block syntax. We also need `apps/workers/src/dto/pipeline-payloads.ts` for Zod schema definitions representing step-functions chunk payloads.
4. **Task 3 Execution**: `apps/workers/src/core/pipeline.ts` must provide functions that extract state chunks and contexts safely from AWS Lambda Event payloads, wrapping the execution context into standardized typed objects using the DTOs from Task 2.

## 3. Caveats
- I did not define the exact Zod schema fields for the pipeline payload chunks, as they depend on the SFN architecture that wasn't explicitly modeled in the provided documentation, but they should include typical map state properties (e.g., `items`, `cursor`, `batch_size`).
- The AWS SFN Error names must exactly match those used in the deployment code (e.g., `RateLimitError`). The implementation should standardize these error names.
- Ensure `apps/workers` inherits standard TS configurations to properly build.

## 4. Conclusion
The codebase is currently a clean slate for `apps/workers`. 

**Step-by-Step Fix Strategy:**

1. **Prerequisites**
   - Update `apps/workers/package.json` to include `"zod"` as a dependency.
   - Set up `tsconfig.json` for `apps/workers` (extending workspace defaults).

2. **Task 1: Environment Configuration**
   - Create `apps/workers/src/config/env.ts`.
   - Import `zod`. Define schemas for DB (e.g. `DATABASE_URL`) and Bedrock (e.g. `BEDROCK_MODEL_ID`, `BEDROCK_REGION`).
   - Call `schema.parse(process.env)` at module load level and export the resulting object.

3. **Task 2: Errors and DTOs**
   - Create `apps/workers/src/core/errors.ts`.
   - Create base and specific error classes (`RateLimitError`, `TimeoutError` as transient; `ValidationError` as terminal). Set `this.name = this.constructor.name`.
   - Create `apps/workers/src/dto/pipeline-payloads.ts`.
   - Define `zod` schemas for Step Function Map payloads (e.g., chunks of identifiers, context). Export both the schemas and inferred types.

4. **Task 3: Pipeline Core Utilities**
   - Create `apps/workers/src/core/pipeline.ts`.
   - Implement a function `parseMapContext(event: unknown)` that validates the event against the schemas from Task 2 and safely extracts the chunk bounds.

## 5. Verification Method
- **Implementation check**: Ensure `apps/workers/src/{config,core,dto}` directories exist with the specified files.
- **Test execution**: Write unit tests in `apps/workers/tests/` to verify that invalid environment variables cause an immediate `ZodError` crash, that custom errors correctly expose their `name` property, and that pipeline context parses successfully.
- **Build check**: Run the workspace build script for `workers` to ensure there are no TypeScript compilation errors.
