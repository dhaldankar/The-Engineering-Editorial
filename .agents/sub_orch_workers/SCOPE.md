# Scope: workers

## Architecture
- Module boundaries: `apps/workers` depends on `packages/db-client` and `packages/harness`.
- It implements the Async Engine logic for Step Functions and Lambdas to ingest and aggregate data.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Core Setup | Tasks 1-3 | none | PLANNED |
| 2 | External Adapters | Tasks 4-5 | none | PLANNED |
| 3 | Repositories | Tasks 6-8 | none | PLANNED |
| 4 | Services | Tasks 9-10 | Adapters, Repositories | PLANNED |
| 5 | Event Handlers | Task 11 | Services, Core | PLANNED |

## Interface Contracts
### `apps/workers` ↔ `packages/db-client`
- Uses repositories for Gold, Silver, Bronze tiers using `packages/db-client`.
### `apps/workers` ↔ `packages/harness`
- Uses `harness` for metric execution topologically.
