# Tasks Document

- [ ] 1. Initialize `harness` Package
  - File: `packages/harness/package.json`
  - Setup Turborepo package with pure TypeScript setup. No heavy external dependencies other than Drizzle ORM (for SQL template tags).
  - Purpose: Establish a fast, zero-infrastructure module for compiling metrics.
  - _Requirements: NFR - Code Architecture_
  - _Prompt: Role: TypeScript Developer | Task: Initialize the `packages/harness` directory. Ensure it builds lightning-fast using `tsc` or `tsup`. | Restrictions: No AWS SDK or Express dependencies allowed. | Success: Package compiles successfully._

- [ ] 2. Implement the Types and DSL
  - File: `packages/harness/src/types.ts`
  - Define the `GrainDimension` type, `MetricDefinition` interface, and the `defineMetric` identity function.
  - Purpose: Create the strict boundary that data analysts will use to author metrics.
  - _Requirements: 1.1, 1.2, 1.3_
  - _Prompt: Role: TypeScript Architect | Task: Write the strict interfaces for the metric DSL exactly as provided in the design spec. | Restrictions: Ensure `reads` and `grain` arrays are strictly typed. | Success: Interfaces are exported and enforce type compilation._

- [ ] 3. Implement the Grain Builder (Idempotency Engine)
  - File: `packages/harness/src/grain.ts`
  - Implement `buildGrainKey(dimensions)` that alphabetizes the keys of the passed object and serializes them into a string.
  - Purpose: Guarantee deterministic unique keys for database UPSERTs.
  - _Requirements: 2.1, 2.2, 2.3_
  - _Prompt: Role: Node.js Developer | Task: Implement a deterministic serializer for a partial record of `GrainDimension`. It must sort keys alphabetically before joining them with pipes (`|`). | Restrictions: Ignore undefined or null dimensions. | Success: Returns exactly `"cluster:7|period:2026-W27|repo:9"` regardless of the order the object keys were inserted._

- [ ] 4. Implement the Registry and Sample Metric
  - Files: `packages/harness/src/registry/index.ts` and `src/registry/pr-size-growth.ts`
  - Export a `registry` array compiling all metrics.
  - Write a sample metric using `defineMetric` and `drizzle-orm` SQL template tags.
  - Purpose: Establish the pattern for data analysts to add future metrics.
  - _Requirements: 3.1_
  - _Prompt: Role: Data Analyst | Task: Implement the `pr_size_growth` metric using the `defineMetric` DSL. Map it to read from `github_prs`. Export the compiled registry array. | Restrictions: Must only contain declarative TypeScript and SQL templates. | Success: The metric is successfully added to the registry array._

- [ ] 5. Implement the Executor and Topological Sorter
  - File: `packages/harness/src/engine.ts`
  - Implement Kahn's Algorithm or a recursive DFS to topologically sort the `registry` array based on the `reads` property.
  - Implement `HarnessEngine` that iterates the sorted array, executes the `compute` function, maps the results through `buildGrainKey`, and calls the injected `dbClient`.
  - Purpose: Execute the DAG dynamically without manual intervention.
  - _Requirements: 3.2, 3.3, 4.1, 4.2, 4.3_
  - _Prompt: Role: Algorithm Engineer | Task: Implement `engine.ts` that takes a database client. Add a private method to topologically sort the `registry` array, throwing a `CircularDependencyError` if cycles exist. Add `runAggregation` to loop through the plan and map the results to the db client. | Restrictions: Fail-fast on cycles. | Success: Engine successfully maps the results into `metric_fact` shapes and calls the injected client._

- [ ] 6. Comprehensive Unit Testing
  - Files: `packages/harness/tests/grain.test.ts` and `tests/engine.test.ts`
  - Write exhaustive unit tests verifying `buildGrainKey` determinism and `HarnessEngine` cycle detection.
  - Purpose: Prove the idempotency and dependency resolution logic.
  - _Leverage: Vitest or Jest_
  - _Requirements: NFR - Reliability_
  - _Prompt: Role: QA Engineer | Task: Write tests proving that `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` produce the same grain key. Write a test passing a circular registry (A reads B, B reads A) to the engine and assert that it throws. | Restrictions: Do not require a live database connection. | Success: Tests pass and prove the safety of the algorithms._
