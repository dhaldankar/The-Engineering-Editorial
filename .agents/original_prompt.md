# Original User Request

## 2026-07-05T17:41:50Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Execute Phases 3 to 6 of the Engineering-Editorial multi-plane architecture. This involves building the async worker engine (Step Functions & Lambdas), completing the REST API and GitHub integration, and finishing the CDK application stacks. The user will handle actual AWS deployment.

Working directory: c:\Users\Lenovo\OneDrive\Documents\Projects\Engineering-Editorial
Integrity mode: development

## Requirements

### R1. The Async Engine (Phase 4)
Implement the `workers` App. Build the Step Functions and Lambdas that ingest and aggregate data. This layer binds the `db-client`, `harness`, and `connectors` together to compute Gold facts. Use the specifications in `.claude/specs/workers`.

### R2. The Boundary & Presentation Layers (Phase 5)
Implement the `integration-github` App (OAuth/Webhook handlers) and the `api` App (REST API reading from Gold facts). Use the specifications in `.claude/specs/integrations` and `.claude/specs/api`.

### R3. Application CDK Stacks (Phase 6)
Implement the application infrastructure in the `infra` directory. Build the `workers-stack`, `api-stack`, and `integration-github-stack` using AWS CDK to wire the Lambda code to AWS API Gateway and Step Functions. Do NOT run `cdk deploy` as the user will handle deployment manually.

## Acceptance Criteria

### Verification
- [ ] The monorepo successfully compiles when running `turbo run build`.
- [ ] The CDK infrastructure correctly synthesizes when running `npm run synth` in the `infra` workspace.
- [ ] No deployment commands (`cdk deploy`) were executed.

---
*Next: when approved ("go", "looks good"), I will delegate to the teamwork_preview subagent.*
