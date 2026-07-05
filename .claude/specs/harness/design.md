# Design Document

## Overview

The `packages/harness` is a pure TypeScript execution engine designed to decouple the definition of analytical metrics from the infrastructure orchestrating them. It acts as the "intellectual core" of the pipeline, parsing metric declarations, building an execution plan via topological sorting, and mapping raw SQL results into strictly formatted `metric_fact` entries.

## Steering Document Alignment

### Technical Standards (tech.md)
This design strictly implements the constraints defined in `architecture.md` (Section 5):
- **Idempotency**: It calculates the deterministic `grain_key`, ensuring that upserts by the `db-client` are safe to retry indefinitely.
- **Dependency Isolation**: Metrics do not know how they are executed, only what they read and what SQL they need to run.

### Project Structure (structure.md)
The `packages/harness` sits directly below the `apps/workers`. It does not contain any AWS SDK or `db-client` specific code directly; it operates purely on interfaces, receiving the database client dependency via injection from the worker.

## Code Reuse Analysis

### Existing Components to Leverage
- **`packages/core-types`**: Relies on core types to define the exact shape of a `MetricFact` being passed to the `db-client`.
- **Drizzle ORM `sql` templates**: If the project standardizes on Drizzle, the harness will accept `sql\`...\`` tagged template literals returned from the metric definitions to prevent SQL injection and allow structural passing to the `db-client`.

## Architecture

The harness is fundamentally an array of plain JavaScript objects (`registry`) fed into a DAG sort, resulting in an ordered execution loop (`HarnessEngine`).

### Modular Design Principles
- **DSL (`src/types.ts`)**: Pure TypeScript interfaces forcing strict implementation bounds (`defineMetric`).
- **Idempotency Core (`src/grain.ts`)**: Pure functions isolated specifically for primary key generation.
- **Engine (`src/engine.ts`)**: The stateful runner that applies dependency injection to bridge the pure metrics to the database.
- **Registry (`src/registry/*.ts`)**: The closed ecosystem where data analysts write logic.

```mermaid
graph TD
    A[Worker: Aggregate Handler] -->|Injects DB Client| B(HarnessEngine)
    B -->|Initialization| C[Topological Sorter]
    C -->|Reads reads: []| D[Metric Registry Array]
    D -->|Metric 1: PR Size| C
    D -->|Metric 2: Cycle Time| C
    C -->|Sorted Execution Plan| E[Execution Loop]
    E -->|1. Compute SQL| F[Metric Definition compute]
    F -->|Raw Rows| E
    E -->|2. Build Key| G[grain.ts buildGrainKey]
    E -->|3. Upsert| H[Injected DB Client]
```

## Components and Interfaces

### The Metric DSL
- **Purpose:** Provide strict intellisense and guardrails for new metrics.
- **Interfaces:** 
  ```typescript
  export type GrainDimension = 'repo' | 'contributor' | 'cluster' | 'pr' | 'work_item' | 'period';

  export interface MetricDefinition {
    name: string;
    version: number;
    tier: 'aggregate' | 'analytical';
    grain: GrainDimension[];
    reads: string[];
    compute: (ctx: ExecutionContext) => Promise<any>; 
  }
  ```

### The Idempotency Backbone (`grain.ts`)
- **Purpose:** Transform n-dimensional grains into a deterministic 1D string for Postgres `UNIQUE` constraints.
- **Interfaces:** `buildGrainKey(dimensions: Partial<Record<GrainDimension, string | number>>): string`
- **Design Detail:** Must sort `Object.keys()` alphabetically before `.join('|')`.

### The Executor (`engine.ts`)
- **Purpose:** DAG sorting and execution.
- **Interfaces:** `class HarnessEngine { constructor(dbClient: DbClient); async runAggregation(repoId, runId); }`
- **Design Detail:** Implements Kahn's Algorithm to sort the `registry` array. Throws `CircularDependencyError` if the graph cannot be flattened.

## Data Models

The output of the harness engine is the canonical `metric_fact` array intended for the Gold tier database.

```typescript
// Mapped by the Engine
interface FactUpsertPayload {
  tenant_id: string; // Passed down from context
  metric_name: string;
  metric_version: number;
  grain_key: string; // Generated deterministically
  value_num?: number;
  value_json?: any;
  run_id: string;
}
```

## Error Handling

### Error Scenarios
1. **Circular Dependency Detected**
   - **Handling:** The topological sort throws a fatal `Error` immediately during class instantiation (or when `getExecutionPlan` runs).
   - **Impact:** System fails loudly and early (fail-fast), alerting developers to the broken metric relationships before production execution.

2. **Metric Compute Failure**
   - **Handling:** A try/catch block within the execution loop catches the SQL error, logs the failing metric name, and throws, aborting the rest of the plan.
   - **Impact:** The `AggregateTask` Step Function retries. Due to the deterministic `grain_key`, metrics that succeeded before the crash are safely ignored/overwritten on retry.

## Testing Strategy

### Unit Testing
- **Grain Generation:** Exhaustive tests for `buildGrainKey` asserting alphabetical stability regardless of object property insertion order.
- **DAG Sorting:** Inject mock metric registries with cycles to verify the `CircularDependencyError` is correctly triggered.
- **Execution Engine:** Inject a mock `dbClient` and verify that `insertFacts` is called exactly once per metric with the correct array mapping and deterministic `grain_key` values.
