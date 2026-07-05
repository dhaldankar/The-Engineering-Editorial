# Scope: Milestone 3 - API App

## Architecture
- Module/package boundaries: `apps/api`
- Dependencies: `packages/db-client` (for repositories), AWS SDKs (for SQS, Step Functions).
- Tasks 1-9 cover setup, DTOs, Repositories, Adapters, and HTTP Handlers.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | API Setup | Env config, HTTP utilities, auth/body middleware | none | IN_PROGRESS |
| 2 | Data Layer | DTOs, Repositories, Adapters | M1 | IN_PROGRESS |
| 3 | Handlers | Dashboard reads, Async triggers | M2 | IN_PROGRESS |

## Interface Contracts
- API HTTP standard JSON responses (`ok`, `accepted`, `badRequest`, etc.)
- Dashboard Metrics DTOs matching frontend expectations.
- SQS and Step Functions adapters triggering the backend pipelines.
