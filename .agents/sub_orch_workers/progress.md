## Current Status
Last visited: 2026-07-05T23:26:26Z
- [x] Initialized sub-orchestrator environment
- [x] Milestone 1: Core Setup - Explorers completed
- [x] Milestone 1: Core Setup - Worker completed
- [ ] Milestone 1: Core Setup - Verification in progress
- [ ] Milestone 2: External Adapters
- [ ] Milestone 3: Repositories
- [ ] Milestone 4: Services
- [ ] Milestone 5: Event Handlers

## Iteration Status
Current iteration: 1 / 32

## Synthesized Strategy for Milestone 1
**Prerequisites**:
1. Update `apps/workers/package.json` to include `"dependencies": { "zod": "latest" }` and necessary devDependencies (`typescript`, `@types/node`). Update `name` to `@engineering-editorial/workers`.
2. Add a `tsconfig.json` to `apps/workers` mirroring the workspace standard (e.g. from `packages/core-types`).

**Task 1**:
1. Create `apps/workers/src/config/env.ts` using Zod to validate Bedrock and Database environment variables, fail fast by calling `.parse(process.env)` at module load, and export the resulting config.

**Task 2**:
1. Create `apps/workers/src/core/errors.ts` defining base error classes `TransientError` and `TerminalError`, ensuring `this.name = this.constructor.name` is explicitly set. Define specific ones like `RateLimitError` extending `TransientError`.
2. Create `apps/workers/src/dto/pipeline-payloads.ts` defining Zod schemas for Step Function Map payloads (`StateChunkSchema`) and export the schemas and inferred types.

**Task 3**:
1. Create `apps/workers/src/core/pipeline.ts` with utilities to parse SFN context and extract chunk context bounds robustly.
