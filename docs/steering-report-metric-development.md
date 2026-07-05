---
inclusion: manual
---

# Feature Steering: Metrics, Signals & Reports

An enforceable thought process for adding a new metric, drift signal, dashboard widget, or
report to Engineering Insights. Follow the phases in order — they mirror the **harness node
model** (transform → metric → signal) and the read-live serving model, **not** the UI
layout. Read this before opening a PR that adds a data point, chart, or report section.

> **The golden rule.** Adding a data point is almost always a *declarative spec*, not a
> schema change. If you find yourself writing a migration or a new table to add a metric or
> a signal, **stop** — you are working against the harness. Only *transforms* (new source
> fields / new canonical entities) touch the schema. Metrics and signals do not.

This file complements the canonical design docs:
- `ARCHITECTURE.md` — planes, monorepo layout, the five DB namespaces, the harness (§5).
- `docs/schema/*.mermaid` — canonical ER diagram per namespace (`core`, `config`, `facts`,
  `report`, `review_lens`).
- `docs/metric-harness.md` — registry, executor, grain vocabulary, node contracts.

## Phase 1: Product & UX Triage

Do not write code until the request is categorized.

1. **Pulse Check vs. Deep Dive**
   - **Pulse Check (live dashboard):** answers "how are we doing right now?" (current
     bus-factor risk count, trailing sync status). Reads `facts.metric_fact` **live** — the
     values are pre-aggregated at write time, so reading is cheap. Belongs in
     `frontend/src/features/dashboard/`.
   - **Deep Dive (async report):** answers "why did this happen over the period?" (cluster
     sentiment trend, drift versus last period). Runs as an `async_reports` job → a report
     generation execution that computes signals. Surfaced in
     `frontend/src/features/reportViewer/`.
2. **What decision does this drive?** If it doesn't lead to an actionable
   engineering-management decision ("split this PR", "redistribute ownership of this
   cluster"), push back on the requirement before building it.
3. **Progressive disclosure:**
   - Dashboard tile grid → top-level health only (signal counts, KPI-style headline
     numbers). Never a full chart here.
   - Report viewer / repository detail → detailed charts, per-cluster breakdowns, trends.

## Phase 2: Classify the Node

Every data point is **exactly one** of three kinds. This choice determines everything that
follows, so make it explicitly.

| Kind | Produces | Reads | Touches schema? |
|---|---|---|---|
| **Transform** | Entities (`core`) | Raw (Bronze) / entities | **Yes** — the only kind that may |
| **Metric** | Facts (`facts.metric_fact`) | Entities (or other facts) | **No** — a `defineMetric` spec |
| **Signal** | `report_signal` rows | Facts (by name) | **No** — a `signal_config` row |

Decision tree:
- A new number/fact computed from existing data → **metric**.
- A period-over-period drift flag shown on a report → **signal**.
- Requires a source field not yet ingested, or a new/changed canonical entity shape →
  **transform** (and usually a metric on top of it afterwards).

> **Stop test.** If adding your "metric" makes you reach for a migration, a new table, or
> `fact_builder`-style hand-written aggregation wiring, you have mis-classified it. A metric
> is rows in `metric_fact` produced by a spec. Re-check Phase 2.

## Phase 3: Author the Node (declarative-first)

### If it's a METRIC

Register a spec — no DDL, no new table, no pipeline wiring:

```ts
defineMetric({
  name: "pr_size_growth", version: 1,
  grain: ["repo", "pr", "period"],
  reads: ["github_prs", "pr_files"],
  tier: "aggregate",                 // "aggregate" reads entities; "analytical" reads facts
  compute: sql`/* GROUP BY producing (grain_key, value) rows */`,
})
```

Rules:
- **Grain is closed.** `grain` must be a subset of `{ repo, contributor, cluster, pr,
  work_item, period }` (with `product` as the implicit tenancy anchor). **Never invent a new
  grain dimension.** If you think you need one, that is a design change — escalate; do not
  add a column.
- **SQL template by default**, function only as the escape hatch for computations that are
  genuinely awkward in SQL. Prefer SQL.
- **Declare `reads`.** The pipeline DAG order is *derived* from dependencies via topological
  sort. Never hand-wire execution order.
- **Idempotency is not optional.** The executor upserts on `grain_key`; the delivery
  guarantee is at-least-once. Your `compute` must be deterministic and re-runnable — it
  returns grain rows, it does not append, and it has no side effects.
- **One scalar per metric where possible** (`value_num`). Decompose composite facts into
  several metrics rather than a JSON blob — bus factor is `top_owner_id` + `ownership_pct`
  as separate metrics, not one object. Reserve `value_json` for genuinely structured facts.

### If it's a SIGNAL

Insert a `signal_config` row — this is **data, not a deploy**:

```jsonc
{
  "reads": ["pr_size_growth", "review_comment_density"],
  "grain": "cluster_period",
  "window": { "type": "period_over_period", "lookback": 1 },
  "rule":   { "op": "pct_increase", "field": "value_num", "threshold": 0.5 },
  "severity": [ { "gte": 1.0, "level": "critical" }, { "gte": 0.5, "level": "warning" } ],
  "narrative": "{cluster} PR size up {delta_pct}% vs last period"
}
```

- Signals **read** facts by name and **write** `report_signal` rows at generation time. They
  hold **no standing state**.
- A new signal is a new row. You only touch code if you need a genuinely new rule `op` — then
  add it to the signal engine, not a migration.

### If it's a TRANSFORM (only if Phase 2 said so)

This is the *only* kind that changes the schema.
- New source field → extend `packages/connectors` (request/response shape) and the **ingest**
  worker (persistence to Bronze). Nothing else talks to GitHub/Jira.
- New canonical entity/column → change the `core` entity and add a migration, **nullable-first**
  if backfilling. Resolve links at transform time (e.g. comment → file) and **log misses**
  rather than silently dropping them.
- Enforce constraints at the DB level: FKs `NOT NULL` where the relationship is mandatory,
  UNIQUE on natural keys so retries stay idempotent.
- Unbounded work (large first sync, per-comment enrichment) → **Step Functions `Map`**
  chunking. Never one monolithic pass; the invocation ceiling is 15 minutes.

## Phase 4: Backend Delivery

Follow the boundaries in `ARCHITECTURE.md` §3 strictly.

1. **Package boundaries.** Connectors live only in `packages/connectors` + the ingest worker.
   The registry/executor/signal engine live in `packages/harness`. API code lives in
   `apps/api` as `handlers → services → repositories → adapters` — no business logic in
   handlers.
2. **API reads through a repository.** A request handler reads `facts.metric_fact` /
   `report_signal` via a service+repository method. It must **never** run a live multi-table
   join over `core` tables whose cost scales with PR/comment/issue volume. If it scales with
   volume, it is a metric (precomputed), not a live query.
3. **Pulse-check endpoint:** synchronous GET reading facts through a per-surface view.
4. **Deep-Dive endpoint:** the handler *only* creates an `async_reports` row and starts the
   generation execution — it computes nothing. Generation computes signals and writes
   `report_signal` rows, idempotently (the report's natural key means a re-run replaces its
   own signal rows).

## Phase 5: Frontend Delivery

Keep components dumb and data-driven, per `ARCHITECTURE.md` §9.

1. **Data access:** one `~/services/*Service.ts` per resource wrapping `fetch` and owning the
   wire types; one `~/hooks/use*.ts` per data need owning loading/error/data state. Widgets
   consume hooks — they never call `fetch` directly.
2. **Real-time status is POLLING.** For an async report, sync, or aggregation run, use the
   polling hook that reads the durable status endpoint. Stop polling at terminal states
   (`completed`/`failed`), pause while the tab is hidden, and pick a cadence per surface.
   **Do not add `EventSource`/SSE** — status is durable state read by `GET`, not a stream.
3. **Empty/error states:** explicitly handle "no data for this period" and "report still
   processing"; never render a chart against an empty or partial array.
4. **Scope by `repo_id`** via route params / context, not prop drilling; tenancy flows from
   the product context.

## The Sanity Check

Before opening a PR that adds a metric, signal, dashboard widget, or report:

1. Did I write a **migration or new table** to add a metric or signal? If yes — **STOP**.
   Only transforms touch schema. Convert it to a `defineMetric` spec (metric) or a
   `signal_config` row (signal).
2. Did I **invent a grain dimension** outside `{ repo, contributor, cluster, pr, work_item,
   period }`? If yes — **STOP**, that's a design change, not a feature.
3. Does my metric's `compute` append/duplicate instead of upserting on `grain_key`, or rely
   on an execution order I hand-wired instead of a declared `reads`? Make it deterministic
   and declare dependencies.
4. Does a request handler run a query over `core` tables whose cost **scales with PR /
   comment / issue volume**? If yes — it belongs in a metric (precomputed), not a live
   endpoint.
5. Did I add **SSE / `EventSource`** or a bespoke poll loop instead of the standard polling
   hook against a durable status endpoint?
6. Did I touch **GitHub/Jira** anywhere outside `packages/connectors` + the ingest worker?
7. Did I place a **detailed chart or per-cluster breakdown on the dashboard tile grid**
   instead of the report viewer / repository detail? Move it.
