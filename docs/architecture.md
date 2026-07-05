# Engineering Insights — Architecture

> "The Engineering Editorial" turns raw GitHub and Jira activity into a weekly editorial
> brief for engineering managers: which code area is under stress, who carries single-owner
> risk, where review is getting heated, which PRs are quietly ballooning. This document
> describes the platform that produces that brief.

## 1. System Overview

Engineering Insights is a multi-tenant SaaS platform that correlates Jira planning data with
GitHub execution data and distills it into metrics, drift signals, and reports. It is built
as a serverless-native application on AWS and organized as a single TypeScript monorepo.

The platform has three planes:

- **API plane** — synchronous request/response over API Gateway + Lambda: CRUD for
  tenants, repositories, connectors, and configuration; job triggering; and reads of
  computed data.
- **Pipeline plane** — asynchronous, Step Functions–orchestrated Lambdas that ingest source
  data, normalize it, enrich it with an LLM, aggregate it into facts, and mine review
  history into reusable rules. All long-running and LLM-touching work lives here.
- **Frontend plane** — a React single-page app served from S3 behind CloudFront, talking to
  the API over REST and reflecting live job progress by polling durable status.

```
                     ┌──────────────────────────────────────┐
                     │        Frontend (React SPA)           │
                     │   dashboard · settings · reports      │
                     │   S3 + CloudFront · polls status      │
                     └──────────────────┬───────────────────┘
                                        │ REST (Cognito-authed)
                     ┌──────────────────▼───────────────────┐
                     │      API Gateway → API Lambdas        │
                     │   CRUD · config · trigger jobs        │
                     └───────┬───────────────────┬───────────┘
                     enqueue │                   │ start execution
                        ┌────▼─────┐      ┌───────▼──────────────┐
                        │   SQS    │      │   Step Functions      │
                        │ (sync    │      │   pipeline DAGs       │
                        │  intake) │      │                       │
                        └────┬─────┘      └───────┬──────────────┘
                             │                    │
                             ▼                    ▼
                     ┌───────────────────────────────────────┐
                     │            Worker Lambdas              │
                     │  ingest · normalize · enrich ·         │
                     │  aggregate · review-lens · report      │
                     └───┬───────────────┬───────────────┬────┘
                         │               │               │
                         ▼               ▼               ▼
                   ┌──────────┐   ┌──────────────┐  ┌──────────┐
                   │ S3 Bronze│   │ Aurora Postgres│ │ Bedrock  │
                   │ raw JSON │   │  Serverless v2 │ │  (LLM)   │
                   └──────────┘   └──────────────┘  └──────────┘
```

The API is deliberately thin: it validates, authorizes, persists configuration, and hands
heavy work off asynchronously. Any request that could exceed a few seconds returns `202
Accepted` immediately with a job identifier the client polls.

## 2. Cloud Topology & Runtime

| Concern | Service |
|---|---|
| Synchronous compute | AWS Lambda behind API Gateway (REST) |
| Async intake | Amazon SQS (the "sync requested" hand-off) |
| Pipeline orchestration | AWS Step Functions (one state machine per DAG) |
| Database | Amazon Aurora PostgreSQL Serverless v2 |
| Raw storage | Amazon S3 (immutable JSON ledger) |
| LLM | Amazon Bedrock (`qwen.qwen3-coder-30b-a3b-v1:0`) |
| Authentication | Amazon Cognito |
| Frontend delivery | S3 + CloudFront |
| Secrets | AWS Secrets Manager (app credentials) + KMS (tenant tokens) |

**Connection management.** Lambda concurrency fans out well beyond what a Postgres instance
will accept as direct connections. All database access goes through a pooled path — RDS
Proxy (or the Aurora Data API for the lightest handlers) — so a burst of concurrent workers
never exhausts the connection ceiling.

**The 15-minute ceiling shapes the pipeline.** A single Lambda invocation caps at fifteen
minutes, so no pipeline stage is written as one monolithic pass over unbounded data. Stages
that can grow without bound — a first-time repository sync, per-comment LLM classification —
are expressed as Step Functions `Map` states that chunk the work across many short
invocations and rejoin before the next stage.

## 3. Monorepo Layout

A pnpm workspace built with Turborepo for cached, incremental builds. Presentation,
integration, API, and pipeline concerns are separate deployables; shared logic lives in
packages with a strict, one-directional dependency graph.

```
apps/
  frontend/            React SPA (dashboard, settings, report viewer)
  api/                 REST API Lambdas (API Gateway)
  integration-github/  GitHub App installation + OAuth callbacks
  integration-jira/    Atlassian 3LO OAuth handshake
  workers/             Step Functions task Lambdas (pipeline stages)
packages/
  core-types/          shared domain types + DTOs (the wire + storage contracts)
  db-client/           Aurora access, schema-scoped repositories, migrations
  harness/             metric registry, executor, grain vocabulary, signal engine
  connectors/          GitHub + Jira API clients, pagination, retry/backoff
  config/              settings loader, environment profiles
  logger/              structured logging
```

Inside `apps/api`, handlers follow a strict dependency direction so business logic never
leaks into transport code:

| Layer | Responsibility |
|---|---|
| `handlers/` | Translate an HTTP/event trigger into a domain call. Validation only. |
| `services/` | Orchestrate multi-step flows and enforce invariants. |
| `repositories/` | Persist and read; own query construction and schema keys. |
| `adapters/` | Quarantine external SDK quirks (Bedrock, SQS, Step Functions, connectors). |
| `dto/` · `core/` | Payload contracts and leaf utilities. |

The **integration apps are isolated on purpose**: the GitHub App lifecycle and the Atlassian
OAuth engine each carry their own security surface, so they are separate deployables to keep
the blast radius small. Tenant API tokens are never exposed to the frontend.

## 4. Data Architecture

Data is tiered in a medallion pattern so that dashboards read pre-computed values in
milliseconds while the heavy transformation happens upstream and asynchronously.

| Tier | Home | Contents |
|---|---|---|
| **Bronze** | S3 | Unparsed GitHub/Jira JSON payloads, exactly as fetched. An immutable ledger that survives schema evolution and enables full recompute. |
| **Silver** | Aurora — `core` namespace | Normalized, canonical entities linking GitHub and Jira: contributors, work items, PRs, reviews, files, clusters. |
| **Gold** | Aurora — `facts` namespace | Pre-computed metrics at fixed grains, read directly by dashboards and reports. |

Configuration, reports, and the review-mining pipeline occupy their own namespaces alongside
these. The five Postgres schemas are:

| Namespace | Holds | Lifecycle |
|---|---|---|
| `core` | Normalized entities — contributors, work items, PRs, reviews, files, clusters, identity resolution | Canonical, mutable, FK-rich |
| `config` | Tenancy root, accounts, connectors, workflow mappings | Configuration |
| `facts` | The long metric store (aggregate + analytical tiers) + run provenance | Append/upsert, uniform shape |
| `report` | Async report jobs, signal configuration, computed signals | Report-scoped |
| `review_lens` | Taxonomy, comment classification, blindspot patterns, synthesized rules | Analytical, LLM-derived |

Canonical schema diagrams live under `docs/schema/*.mermaid`, one file per namespace.

### 4.1 Multi-tenancy

The tenant root is a **Product**; a Product owns many **Repositories**.

```
products (id, name UNIQUE)
  └─ repositories (id, product_id FK, key, display_name, status,
                   github_owner, github_repo, jira_project_key,
                   ticket_key_pattern, UNIQUE(product_id, key))
```

Every row in every downstream namespace carries a `product_id` tenancy anchor. Isolation is
structural: no query below the tenant root omits it, so cross-tenant leakage is impossible by
construction. Repository scope is a *dimension*, not the tenancy anchor — which keeps the door
open for tenant-wide, cross-repository analytics without reshaping the store.

### 4.2 `core` — normalized entities

Contributors (the people whose work is analyzed) are resolved across platforms and keyed on
normalized email. GitHub logins and Jira account IDs map to a canonical contributor;
identities that cannot be resolved to an email are quarantined rather than dropped.

| Table | Notes |
|---|---|
| `contributors` | Canonical person, keyed on `email`; carries display name and avatar. |
| `contributor_identities` | Links a GitHub login / Jira accountId to a contributor. `UNIQUE(source, external_id)`. |
| `contributor_identity_unresolved` | Identities seen during ingestion with no resolvable email, tagged by reason. |
| `work_items` | Canonical ticket. Carries `issue_type` and `priority` as first-class dimensions; assignee/reporter resolve to contributors. |
| `work_iterations` | A ticket's distinct dev cycles — a QA bounce reopens a new iteration. |
| `github_prs` | Canonical PR, linked to the work item and iteration it implements; author resolves to a contributor. |
| `reviews` | Review with LLM-enriched `tone` / `feedback_aspect`, populated asynchronously. |
| `review_comments` | Inline comment with `pr_file_id` (the resolved link to the file), enriched `tone` / `change_type`, and `path` retained as the raw origin string. |
| `pr_files` | Per-file diff stats for a PR. |
| `code_clusters` | Logical code areas with a `curation_status` (`auto`/`confirmed`/`renamed`/`manual`/`archived`); human-curated clusters are never overwritten. |
| `cluster_assignments` | One file → one cluster, via longest-prefix match. |

The comment-to-file link is a real foreign key resolved once during normalization — the point
at which an unmatched path can be logged — rather than a string join re-derived on every
analytical read. This is load-bearing: every per-cluster review metric depends on
comment → file → cluster resolving correctly.

Source links point *out* to Bronze as opaque keys (a Jira issue id, an S3 pointer), not as
foreign keys into a raw table; the raw ledger lives in S3, and Silver holds only canonical
form.

### 4.3 `config` — tenancy, accounts, connectors, mappings

| Table | Notes |
|---|---|
| `products` / `repositories` | The tenancy root (Section 4.1). |
| `accounts` | Cognito principals — the people who *log in*. Belong to a Product; carry a nullable `contributor_id` link so a signed-in user can be tied to the developer they are in the data. |
| `data_connectors` | Encrypted GitHub/Jira tokens with versioned columns for key rotation. A Product-level connector is the default; a Repository-level row overrides it (resolution: repository → product). |
| `workflow_status_mappings` | Maps a repository's own Jira status strings to the six canonical lifecycle phases. Normalized (`UNIQUE(repo_id, jira_status)`) so phase joins stay cheap on the hot analytical path. |

The canonical lifecycle is six phases: `backlog → ready → in_dev → str → qa → done`. Jira
status vocabularies vary per team; the mapping table standardizes them so downstream
analytics are uniform. A status not yet mapped can be inferred with an LLM and confirmed by a
user.

The **account ↔ contributor link** is the seam that lets a logged-in user see the
repositories they have contributed to — derived by walking contributor → authored PRs →
repositories, rather than stored as an explicit membership list.

### 4.4 `facts` — the metric store

The Gold tier is a single long store. Every computed metric is rows in `metric_fact`, not a
column in a bespoke table — which is what makes adding a metric a code change with no
migration.

`metric_fact` is **long on the metric axis and fixed on the grain axis**. The grain
vocabulary is a closed, small set of dimensions — repository, contributor, cluster, PR, work
item, period — each a nullable foreign key. A metric populates the subset its grain needs and
leaves the rest null. Because the dimensions are real foreign keys, facts join honestly back
to `core`; because the metric name is a value rather than a schema object, new metrics never
touch DDL.

| Column group | Columns |
|---|---|
| Tenancy | `product_id` (always present) |
| Identity | `metric_name`, `metric_version`, `tier` (`aggregate`\|`analytical`), `grain` |
| Grain (nullable FKs) | `repo_id`, `contributor_id`, `cluster_id`, `pr_id`, `work_item_id`, `period_start`, `period_end` |
| Value | `value_num`, `value_json`, `value_type` |
| Keying / provenance | `grain_key`, `run_id`, `computed_at` |

**`grain_key` is the idempotency backbone.** Because grain columns are nullable and Postgres
treats NULLs as distinct in unique indexes, the executor computes a deterministic, non-null
string from only the populated dimensions (e.g. `repo:9|contributor:42|cluster:7|period:2026-W05`)
and that string is the conflict target in `UNIQUE(product_id, metric_name, metric_version,
grain_key)`. The foreign-key columns exist for reading; `grain_key` exists for writing exactly
once. Every upsert flows through it, which matters because the pipeline delivers at least once.

`metric_run` records one row per executor run — which run wrote which facts, how many, and
whether it failed. It is both the provenance trail on every fact and the durable status the
frontend polls for aggregation progress.

The two tiers share one physical shape: **aggregate** facts roll up entities; **analytical**
facts are derived from other facts. The difference is what a metric reads, declared in code,
not where it is stored.

### 4.5 `report` — jobs and drift signals

Reports are intentionally lean. A report is a job plus the signals it fired; the numbers it
displays are read live from `facts` rather than copied per report.

| Table | Notes |
|---|---|
| `async_reports` | The report job and artifact in one. Carries status and stage (the poll surface), period bounds, `worker_version`, retry count, and error. `UNIQUE(product_id, repo_id, report_type, period, period)` makes regeneration idempotent. |
| `signal_config` | Durable, declarative drift rules — the lookups a report performs. The `spec` names the metrics to read, the comparison window, the threshold rule, the severity mapping, and the narrative template. A new signal is a row. |
| `report_signal` | A fired signal for one report: severity, magnitude, narrative, and an `evidence` payload freezing the fact ids and values it fired on. |

**Signals detect drift**, so they compare a period against its predecessor. They only ever
read facts and write report-scoped rows, so they add no standing pipeline state and cannot
corrupt anything upstream. The judgment is frozen in `report_signal.evidence` at generation
time — "on this date we flagged this, here is the data" survives even if thresholds change or
facts are later recomputed — while the live fact values stay a single source of truth.

Report *composition* — which metrics and signals a `report_type` includes — is defined in code
alongside the metric registry. Report *instances* are jobs; signals are configuration rows.
This gives a clean gradient: a new report type is code, a new signal is data, a new report run
is a job.

### 4.6 `review_lens` — blindspot mining

A layered pipeline mines historical review comments into reusable, atomic review rules:

| Stage | Output | Notes |
|---|---|---|
| Taxonomy | `project_classification_taxonomy` | Per-repository, LLM-induced issue categories. Versioned; one active version at a time. |
| Classification | `fact_review_comment_classification` | Each comment classified against the active taxonomy (category, actionability, severity, whether it was addressed). |
| Aggregation | `fact_cluster_blindspot_pattern` | Recurrence of `(cluster, category)` with exemplar comments. |
| Synthesis | `fact_cluster_blindspot_rule` | Atomic rules (trigger, detection cue, fix prescription, confidence, status). |

Active rules are packaged into a downloadable Kiro skill artifact, so the patterns a team
repeatedly catches in review become tooling that catches them earlier.

## 5. The Metric Harness

The harness is the opinionated core of the system, and its single principle is: **separate
the definition of a data point from its execution.** A metric is a declarative spec; a generic
executor does all the plumbing. Adding "PRs quietly ballooning" is one spec, not a DDL change
plus aggregation SQL plus worker wiring plus an endpoint.

**Closed grain vocabulary.** The fixed dimension set (Section 4.4) is what lets one executor,
one serving path, and one rollup generalize over every metric. A metric cannot invent an
arbitrary grain, and that constraint is precisely what buys the generality.

**Registry in code.** Each metric is declared with its name, version, grain, tier,
dependencies, and computation:

```ts
defineMetric({
  name: "pr_size_growth", version: 1,
  grain: ["repo", "pr", "period"],
  reads: ["github_prs", "pr_files"],
  compute: sql`/* GROUP BY producing (grain_key, value) rows */`,
})
```

The declared dependencies give the pipeline DAG for free: the registry is topologically
sorted, so a metric that reads two upstream facts automatically runs after them. No pipeline is
hand-drawn.

**Two ways to compute.** Most metrics are SQL templates aggregating in bulk with no per-row
work. A function escape hatch covers computations that are awkward in SQL, so the harness never
becomes a walled garden.

**Three node kinds, one executor.** Everything the pipeline computes is one of three
contracts:

| Kind | Produces | Reads | Nature |
|---|---|---|---|
| Transform | Entities | Raw / entities | Often a function; the long-running, chunkable stages (normalization, LLM enrichment, the review-lens stages). |
| Metric | Facts | Entities | SQL-template bulk aggregation; the bulk of the registry. |
| Signal | Report rows | Facts | Threshold/delta interpretation, evaluated at report time. |

Signals reading facts by name, and reports being a selection of named facts and signals, is
why "add a report" reduces to "pick which metrics to include" — no new pipeline.

## 6. Pipeline Orchestration

Two Step Functions state machines own sequencing, retries, and fan-out. The *coarse* stage
topology is stable; the churn — new metrics, new signals — happens inside the aggregate stage,
driven by the registry, in code. Adding a metric never edits a state machine.

**Main pipeline:**

```
sync intake (SQS) → ingest → normalize → enrich → aggregate → (done)
```

- **ingest** — paginate GitHub + Jira since the last high-water mark, writing raw JSON to S3
  Bronze. A `Map` state chunks large first-time pulls.
- **normalize** — Bronze → `core` canonical entities; resolve identities; resolve
  comment → file links; detect iteration boundaries and QA-rejection transitions.
- **enrich** — Bedrock tone / feedback-aspect enrichment on reviews and comments (`Map` over
  batches).
- **aggregate** — run the registry's metrics in dependency order, upserting `metric_fact`.

**Review Lens pipeline:**

```
taxonomy → classify → aggregate patterns → synthesize rules
```

Classification `Map`-fans over comment batches; pattern aggregation is a join that waits for
all classification to finish. Both machines publish progress by writing durable status rows,
never by holding a connection open.

Reports are triggered on demand: the API accepts a request, records an `async_reports` job, and
starts a short generation execution that computes signals for the period and writes
`report_signal` rows.

## 7. API Surface

REST over API Gateway, Cognito-authenticated, resource paths scoped under the tenant.
Conventions: `201` create, `202` async accept, `204` delete, `409` conflict.

| Area | Endpoints |
|---|---|
| Health | `GET /health`, `GET /ready` |
| Products / Repositories | `GET/POST /products`, `GET /products/current`, `GET/POST /repositories`, `GET/PATCH/DELETE /repositories/{id}`, `GET /repositories/{id}/stats` |
| Connectors | `GET/PUT/POST(test)/DELETE /products/current/connector`, same under `/repositories/{id}/connector` (repository → product fallback) |
| Clusters | `GET/POST /repositories/{id}/clusters`, `PATCH .../clusters/{cluster_id}`, `POST .../clusters/recompute`, `POST .../clusters/import`, `DELETE .../data` |
| Workflow mapping | `GET/PUT /repositories/{id}/workflow-mappings`, `POST .../infer`, `GET .../statuses` |
| Sync | `GET/POST /repositories/{id}/sync`, `GET .../sync/runs[/{run_id}]` |
| Reports | `POST/GET /repositories/{id}/reports`, `GET/DELETE .../reports/{id}`, `GET .../reports/{id}/data`, `GET .../reports/{id}/status` (poll) |
| Signals | `GET/PUT /repositories/{id}/signals` (signal configuration) |
| Review Lens | `GET .../artifacts/kiro-skill`, `POST .../review-lens/refresh`, `GET .../review-lens/status`, `GET .../review-lens/taxonomy`, `POST .../review-lens/taxonomy/rediscover`, `POST .../review-lens/rules/{id}/archive` |
| Contributors | `GET /repositories/{id}/contributors[/unresolved]`, `GET /contributors/{id}`, `POST /contributors/merge` |

Async endpoints return immediately with a job id; the client polls the corresponding status
endpoint.

## 8. Real-Time Status (Polling)

Job progress is durable state, not an ephemeral event stream. Every worker writes its progress
onto a status row — the sync run, the `metric_run`, the `async_reports` job — and the frontend
reads it with a plain `GET`. A late or refreshed client always sees true current state with no
replay logic, and short polling requests fit Lambda + API Gateway cleanly.

Poll targets:

| Surface | Status source | Terminal states |
|---|---|---|
| Sync progress | sync run row | `completed` / `failed` |
| Aggregation progress | `metric_run` | `completed` / `failed` |
| Report generation | `async_reports` | `completed` / `failed` |

Polling hooks stop at terminal states, pause while the tab is hidden, and choose a cadence per
surface (a few seconds for active jobs, much slower for ambient dashboard data).

## 9. Frontend Architecture

React + TypeScript, built with Vite, routed with `react-router-dom`, served as a static SPA
from S3 behind CloudFront.

Progressive disclosure keeps render times fast and avoids data fatigue:

- **Landing** — repository cards with identity, sync health, last-synced, and one hero metric.
- **Repository workspace** — a tabbed view: a live dashboard reading Gold facts, a reports
  grid for heavier time-bound reports, and a config tab (connectors, clusters, workflow
  mapping).

The internal structure separates concerns cleanly:

```
frontend/src/
├── app/         routes, guards
├── contexts/    current product, repository list (the only cross-cutting state)
├── features/    onboarding · dashboard · reportViewer · settings
├── hooks/       data + polling hooks (own loading/error state and the poll lifecycle)
├── services/    one file per API resource — thin fetch wrappers owning the wire types
├── theme/       styling tokens
└── types/       shared model types
```

Services wrap `fetch` and own wire types; hooks own loading/error/data state and the polling
lifecycle; features compose hooks and components into pages. There is no global state library —
context covers only the two genuinely cross-cutting concerns. Live updates flow through polling
hooks rather than open connections.

## 10. Security & Multi-tenancy

- **Authentication.** Cognito issues identity; accounts belong to a Product. API handlers
  authorize every request against the caller's tenancy.
- **Isolation.** Every query below the tenant root is `product_id`-scoped; cross-tenant access
  is impossible by construction.
- **Secrets.** Application-level OAuth credentials (the GitHub App, the Atlassian client) live
  in Secrets Manager. Per-tenant access tokens are encrypted at rest in Aurora with versioned
  key columns, so keys rotate without invalidating stored ciphertext. Tokens are never returned
  to the frontend.
- **Raw ledger.** Bronze JSON in S3 is immutable and access-scoped per tenant.

## 11. Configuration & Environments

`packages/config` loads settings by environment profile and resolves secrets only from the
environment (never from checked-in config). Relative paths and service endpoints are anchored
consistently so API and workers agree on the same resources.

Because the runtime is serverless, local development runs the cloud surface locally — SQS,
Step Functions, and S3 via a local emulation stack, Aurora via a local Postgres, and Cognito
mocked at the edge — rather than a single in-process process. This keeps local and production
topologies aligned at the cost of a heavier local harness, which is budgeted for explicitly.

## 12. Non-Functional Notes

- **Idempotency.** Every pipeline stage is safe to retry. Natural-key uniqueness backs every
  upsert — sync runs, `grain_key` on facts, report natural keys, blindspot patterns — which is
  required because SQS delivers at least once.
- **Long tasks.** Work that can exceed the Lambda ceiling is decomposed with Step Functions
  `Map` and rejoined; no stage holds a database connection for the life of a long task.
- **Observability.** `metric_run` and job/sync status rows double as the operational record of
  what ran, when, and with what result.
- **Local/prod parity.** The local emulation stack mirrors the production service topology so
  behavior is consistent across environments.

## 13. Reference Documents

- `docs/schema/core.mermaid`, `config.mermaid`, `facts.mermaid`, `report.mermaid`,
  `review_lens.mermaid` — canonical ER diagram per namespace.
- `docs/product-design.md` — product vision, personas, information architecture.
- `docs/metric-harness.md` — the registry, executor, grain vocabulary, and node contracts.
- `docs/cluster-assignment.md` — the tree-based longest-prefix cluster assignment algorithm.
