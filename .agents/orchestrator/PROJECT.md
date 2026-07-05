# Project: Engineering-Editorial
# Scope: Global

## Architecture
- `workers`: Async engine for step functions and lambdas computing Gold facts.
- `integration-github`: Boundary layer handling GitHub OAuth and webhooks.
- `api`: Presentation layer exposing REST APIs over Gold facts.
- `infra`: Application infrastructure with AWS CDK stacks linking everything together.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Async Engine | apps/workers | None | PLANNED |
| 2 | Boundary Layer | apps/integration-github | None | PLANNED |
| 3 | Presentation Layer | apps/api | None | PLANNED |
| 4 | Application Stacks | infra | M1, M2, M3 | PLANNED |

## Interface Contracts
### `workers` ↔ `infra`
- `workers` outputs built code to `apps/workers/dist` (or similar depending on turbo build) which `infra` constructs reference as Lambda assets.
### `api` ↔ `infra`
- `api` outputs built code to `apps/api/dist` referenced by `api-stack`.
### `integration-github` ↔ `infra`
- `integration-github` outputs built code referenced by `integration-github-stack`.

## Code Layout
- Apps live under `apps/`
- Shared packages live under `packages/`
- CDK code lives under `infra/`
