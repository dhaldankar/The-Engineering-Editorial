# The Metric Harness — Design Reference

This document describes *what the harness is*: the model, the contracts, and the mechanics
behind every computed data point in Engineering Insights. It is descriptive reference, not
process — for the enforceable "how do I add a feature" workflow, see the steering file
`.kiro/steering/metric-harness.md`.

## 1. Principle

The harness exists to **separate the definition of a data point from its execution.** A data
point is declared as a spec; a single generic executor does the plumbing — ordering, running,
persisting, deduplicating. This is the property that keeps the system maintainable: adding
"PRs quietly ballooning" is one declarative spec, not a schema migration plus aggregation SQL
plus worker wiring plus a serving endpoint.

Everything downstream — the fact store shape, the pipeline DAG, the serving layer — is
generic *because* definitions are constrained to a small, closed vocabulary. The constraints
are what buy the generality.

## 2. The Closed Grain Vocabulary

Every fact is measured at a **grain**: the set of dimensions it is keyed by. The vocabulary of
dimensions is fixed and small:

| Dimension | Meaning |
|---|---|
| `product` | Tenancy anchor. Always present; not part of the measured grain. |
| `repo` | Repository. A grain dimension (nullable — see below). |
| `contributor` | A resolved person. |
| `cluster` | A logical code area. |
| `pr` | A pull request. |
| `work_item` | A canonical ticket. |
| `period` | A time window (`period_start` / `period_end`). |

A metric populates the subset of dimensions its grain requires and leaves the rest null. The
vocabulary being *closed* is the single most important design constraint: it is what lets one
executor, one serving path, and one rollup generalize over every metric. A metric that could
invent an arbitrary dimension would break that generality and force bespoke handling — so new
dimensions are a design change, never a feature.

**Tenancy is not grain.** `product_id` is a separate concern from the measured grain: it is
the isolation anchor, always present, and it prefixes every uniqueness constraint. `repo_id`,
by contrast, is a *grain dimension* — populated for repository-scoped facts (all current
facts) and nullable so that tenant-wide, cross-repository facts have a natural home without
reshaping the store.

## 3. The Fact Store

The Gold tier is a single table, `facts.metric_fact`, that is **long on the metric axis and
fixed on the grain axis**. Every metric is rows, not a column in a bespoke table.

| Column group | Columns | Role |
|---|---|---|
| Tenancy | `product_id` | Isolation anchor (always present) |
| Identity | `metric_name`, `metric_version`, `tier`, `grain` | Which metric, which shape |
| Grain (nullable FKs) | `repo_id`, `contributor_id`, `cluster_id`, `pr_id`, `work_item_id`, `period_start`, `period_end` | The measured dimensions |
| Value | `value_num`, `value_json`, `value_type` | The measurement |
| Keying / provenance | `grain_key`, `run_id`, `computed_at` | Idempotency + lineage |

The dimensions are **real foreign keys**, so facts join honestly back to `core` and `config`
without string parsing. The metric identity is a **value**, so new metrics never touch DDL.
These two properties together are why the store is both extensible (add a metric → add rows)
and queryable (join a fact → its cluster/contributor directly).

### 3.1 Two tiers, one shape

`tier` distinguishes two kinds of fact that share identical physical shape:

- **aggregate** — rolls up entities (`core`) into a fact. Most metrics.
- **analytical** — derived from *other facts* rather than from entities.

The difference is what a metric *reads*, declared in its spec — not where it is stored. One
table, one executor, tagged by tier.

### 3.2 Value channels

`value_num` carries the overwhelming majority of measurements (counts, ratios, densities,
percentages). `value_json` is an escape hatch reserved for genuinely structured facts. A
metric's declared type populates `value_type` as a read-time discriminator so generic serving
code need not consult the registry.

Prefer **several scalar metrics over one structured blob** whenever the parts are
independently queryable. Bus factor is modeled as `top_owner_id` + `ownership_pct` as separate
metrics, not one object, because a reader will want to threshold and sort on `ownership_pct`
alone.

## 4. `grain_key` — the Idempotency Backbone

Because grain dimensions are nullable and Postgres treats NULLs as *distinct* in unique
indexes, a unique constraint over the raw dimension columns cannot reliably deduplicate rows
or drive `ON CONFLICT`. So the executor derives a deterministic, non-null string from **only
the populated dimensions**, in a fixed canonical order:

```
repo:9|contributor:42|cluster:7|period:2026-W05
```

That string is the conflict target in:

```
UNIQUE (product_id, metric_name, metric_version, grain_key)
```

The division of labor is deliberate: the **foreign-key columns are for reading** (honest
joins); **`grain_key` is for writing exactly once**. Every upsert in the system flows through
it. This matters because the pipeline's delivery guarantee is at-least-once — redelivery is
inevitable, so the write must be idempotent by construction, not by luck.

## 5. The Registry

Metrics are declared in **code**, not in the database — a registry of specs, authoritative at
build time:

```ts
defineMetric({
  name: "pr_size_growth",
  version: 1,
  grain: ["repo", "pr", "period"],
  reads: ["github_prs", "pr_files"],
  tier: "aggregate",
  compute: sql`/* GROUP BY producing (grain_key, value) rows */`,
})
```

| Field | Meaning |
|---|---|
| `name` / `version` | Registry identity; `version` lets a metric's definition evolve without rewriting history. |
| `grain` | Subset of the closed vocabulary this metric is keyed by. |
| `reads` | Upstream entities or facts this metric depends on. |
| `tier` | `aggregate` (reads entities) or `analytical` (reads facts). |
| `compute` | The computation — a SQL template or a function (§7). |

Keeping the registry in code (rather than a DB table) is what makes adding a metric a code
change with no migration. A thin catalog table mirroring the registry is possible for
referential integrity or an admin UI, but is not required by the harness.

## 6. Dependency Resolution & the DAG

The `reads` field is the quiet hero of the design: it makes the pipeline DAG **derived, not
hand-drawn**. The executor topologically sorts the registry by declared dependencies, so a
metric that reads two upstream facts automatically runs after both. No metric author ever
wires execution order; declaring what you read *is* declaring where you run.

This is also why `analytical` facts work cleanly: an analytical metric simply `reads` other
metrics' outputs, and the sort places it after them.

## 7. Compute: SQL Template vs Function

Two computation strategies, one contract — each returns `(grain_key, value)` rows:

- **SQL template** (default): a single bulk aggregation (`GROUP BY`) producing all grain rows
  in one query. No per-row work, no N+1. This suits the large majority of metrics.
- **Function** (escape hatch): a computation expressed in code, for logic that is genuinely
  awkward in SQL. Same output contract, so the executor treats it identically.

Prefer SQL. The function path exists so the harness never becomes a walled garden, not as a
default.

## 8. The Executor

The executor is the single generic engine that runs the registry. Conceptually, one pass:

1. **Sort** the registry topologically by `reads`.
2. **Run** each spec in order — execute its SQL template or function to produce grain rows.
3. **Upsert** each row into `metric_fact` on `grain_key` (idempotent by construction).
4. **Record** provenance: a `metric_run` row captures which run wrote which facts, how many,
   and whether it failed.

Because idempotency lives in the executor rather than in each metric, a metric author *cannot*
write a non-idempotent metric — the executor always upserts. `metric_run` doubles as the
durable status the frontend polls for aggregation progress.

## 9. Node Contracts

Everything the pipeline computes is exactly one of three node kinds. Same executor discipline,
different contracts:

| Kind | Produces | Reads | Computation | Touches schema |
|---|---|---|---|---|
| **Transform** | Entities (`core`) | Raw / entities | Usually a function | Yes — the only kind that does |
| **Metric** | Facts (`metric_fact`) | Entities or facts | SQL template / function | No |
| **Signal** | `report_signal` rows | Facts (by name) | Declarative rule (§10) | No |

- **Transforms** produce or update canonical entities — normalization, identity resolution,
  link resolution, LLM enrichment. They are the long-running, chunkable nodes and the only
  ones that may change the schema (a new source field or a new canonical column).
- **Metrics** aggregate entities into facts. The bulk of the registry.
- **Signals** interpret facts into report-scoped drift. Covered next.

## 10. Signals

Signals are report-scoped drift detectors, evaluated **at report generation time**, not stored
as standing pipeline state. A signal is a declarative configuration row (`signal_config`) whose
`spec` names the metrics to read, the comparison window, the rule, and the severity mapping:

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

Key properties:

- **Read-only against facts.** A signal reads `metric_fact` by metric name for the report's
  period and its comparison period, applies the rule, and writes `report_signal` rows. It holds
  no standing state and cannot corrupt anything upstream.
- **Drift = period over period.** The comparison window is intrinsic; a signal exists to
  surface change, so it always reads at least two periods.
- **Frozen judgment over live facts.** The fired signal captures its evidence (the fact ids and
  values it fired on) at generation time, so the interpretation is immutable even though the
  underlying fact values are read live and may later be recomputed.
- **A new signal is data.** Adding a drift detector is a `signal_config` row. Code changes only
  when a genuinely new rule `op` is needed, in which case the op is added to the signal engine.

## 11. Idempotency & Delivery

The pipeline delivers at least once (SQS intake, Step Functions retries), so every node is
built to be safe to re-run:

- Metrics upsert on `grain_key` — re-running a metric replaces its rows rather than
  duplicating them.
- Transforms enforce UNIQUE constraints on natural keys so a replayed normalization is a
  no-op-or-update, never a duplicate.
- Report generation keys on the report's natural key, replacing its own `report_signal` rows
  on regeneration.

Idempotency is a property of the harness, not a discipline asked of each author.

## 12. Relationship to Orchestration

The harness and the orchestration layer meet at exactly one point and are otherwise
independent. Step Functions models only the **coarse, stable stages** — ingest → normalize →
enrich → aggregate — and that topology is frozen. All the churn that a growing product
generates (new metrics, new signals) happens *inside* the aggregate stage (and at report time
for signals), driven by the registry, in code.

The consequence: adding a metric never edits a state machine, and the scaling concerns of the
15-minute invocation ceiling apply at *stage* granularity (a `Map` chunks a big enrichment or
first sync), not per metric. The thing that changes weekly is code and data; the thing that
rarely changes is the only infrastructure.

## 13. Extending the Harness (at a glance)

The enforceable process lives in the steering file; in summary:

- **A new metric** → a `defineMetric` spec. No migration.
- **A new signal** → a `signal_config` row. No deploy (unless a new rule op).
- **A new transform** → extend a worker; a migration only if a new entity or column is
  genuinely required. Chunk unbounded work with `Map`.
- **A new grain dimension** → not a feature. It is a design change to the closed vocabulary and
  is escalated, not added inline.
