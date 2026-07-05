# Scope: Milestone 2 - integration-github

## Architecture
- `apps/integration-github` Boundary Layer
- Provides GitHub OAuth and Webhook endpoints, config validation, cryptographic webhook signature verification, data_connectors persistence.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | GitHub Integration Layer | Tasks 1-5 of specs/integrations/tasks.md | none | IN_PROGRESS |

## Interface Contracts
### GitHub Integration ↔ Core/DB
- OAuth tokens persisted into `config.data_connectors` using `packages/db-client`
- Handlers orchestrate OAuth setup, callback redirection, and payload signature verification.
