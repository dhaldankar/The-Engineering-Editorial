# Requirements Document

## Introduction

Engineering Insights turns raw GitHub and Jira activity into a weekly editorial brief for
engineering managers. This feature builds the **frontend plane** described in
`docs/architecture.md` Section 9: a React + TypeScript single-page application, built with
Vite and routed with `react-router-dom`, served statically from S3 behind CloudFront, that
lets a signed-in user connect data sources, configure a Project and its Repositories, watch
sync/aggregation/report jobs progress via polling, and read the resulting dashboards and
editorial report briefs.

This is a **greenfield build**. `apps/frontend` today contains only `docs/`, `scripts/`
(the Wireloom → SVG mockup-rendering tool), and `package.json`. There is no `src/` yet. This
spec defines the complete `frontend/src/` application: app shell, routing, auth, the eight
screens defined by the Wireloom wireframes in `apps/frontend/docs/wireframes_v2/`, and the
service/hook layers that connect them to the REST API in architecture.md Section 7.

## Alignment with Product Vision

Engineering Insights' value is turning correlated GitHub/Jira data into an actionable weekly
brief with minimal friction: connect sources once, let the pipeline run asynchronously, and
surface progress and results without the user needing to understand the underlying
Step-Functions machinery. The frontend is the only surface a user ever sees, so it must:

- Make onboarding (connecting GitHub + Jira) the first and only unlocked action for a new
  Project, consistent with the progressive-disclosure design in architecture.md Section 9.
- Reflect live job state (sync, aggregation, report generation) truthfully via polling
  against durable status rows (architecture.md Section 8), never fabricating or caching
  stale progress.
- Respect strict tenant isolation: every view is scoped to the current Project (and,
  within it, the current Repository), matching the `product_id`-scoped data model in
  Section 4.1.
- Keep the codebase modular per Section 9's prescribed folder layout so that adding a new
  report type, metric, or signal later requires touching a small, predictable surface.

## Requirements

### Requirement 1 — Authentication & Session

**User Story:** As a registered user, I want to log in with my Cognito credentials and stay
authenticated across page reloads, so that I can access my Project's data securely and
without re-entering credentials unnecessarily.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any application route THEN the system SHALL
   redirect them to a login screen rendered by AWS Amplify Auth (Cognito) before any
   protected content is fetched or displayed.
2. WHEN a user submits valid Cognito credentials THEN the system SHALL establish a session,
   attach the resulting identity token as an `Authorization` header on every subsequent REST
   call, and redirect the user to their last-intended route (or the Project landing route if
   none was intended).
3. IF a Cognito session token expires or is rejected by the API with `401` THEN the system
   SHALL clear local session state and redirect the user to the login screen.
4. WHEN an authenticated user reloads the browser THEN the system SHALL restore the session
   from Amplify's persisted credentials without requiring the user to log in again, provided
   the underlying Cognito session is still valid.
5. WHEN a user selects "Sign out" THEN the system SHALL clear the Amplify session and all
   cached query data, then redirect to the login screen.

### Requirement 2 — App Shell: Topbar, Sidebar, Breadcrumb, Routing Guards

**User Story:** As a user, I want a consistent global chrome (logo, Project switcher,
breadcrumb, sync events, avatar, sidebar) on every screen, so that I always know where I am
and can navigate predictably.

#### Acceptance Criteria

1. WHEN any authenticated screen renders THEN the system SHALL display a topbar containing
   the "Engineering Insights" wordmark, a Project switcher control showing the current
   Project's name, a breadcrumb reflecting the current navigation path, a global "Sync
   events" action, and a user avatar, matching `app-shell.md`.
2. IF the current Project has no working data connector (neither GitHub nor Jira reachable
   via `test_connectivity()`) THEN the sidebar SHALL render the onboarding-pending state:
   only "Connector" is enabled; "Settings" and "Repositories" render in a locked/disabled
   visual state and are not navigable, per `app-shell.md` State 1.
3. WHEN the current Project has at least one working connector THEN the sidebar SHALL
   render the connected state: "Connector", "Settings", and a "Repositories" accordion
   (expandable, listing each Repository by name, with an "Add Repository" action) are all
   enabled, per `app-shell.md` State 2.
4. WHEN a user clicks the "Repositories" accordion header THEN the system SHALL navigate to
   the Repository Landing screen (`repository-landing.md`) without requiring a specific
   repository to be selected first.
5. WHEN a user clicks a specific repository name in the sidebar accordion THEN the system
   SHALL navigate to that repository's workspace, defaulting to its Dashboard tab.
6. WHEN a user clicks the Project switcher THEN the system SHALL present the list of
   Projects the current account belongs to and, on selection, SHALL update the current
   Project context and re-navigate to that Project's landing route (creating a new Project
   is out of scope per `app-shell.md`'s note that the create-flow is intentionally not
   wireframed).
7. WHEN a user clicks "Sync events" THEN the system SHALL open a panel/list of in-flight and
   recent sync/job events for the current Project, with a numeric badge reflecting the count
   of active (non-terminal) events.
8. IF a route requires an authenticated session and none exists THEN the system SHALL block
   rendering of that route's content and redirect to login (ties to Requirement 1.1).
9. IF a route requires the connected-sidebar state (Settings, Repositories, and their
   children) and the current Project is still onboarding-pending THEN the system SHALL
   redirect the user to the Connector screen rather than rendering the requested route.

### Requirement 3 — Project Connector (Onboarding & Ongoing Data Source Management)

**User Story:** As a Project admin, I want to connect and manage GitHub and Jira
connections for my Project, so that the pipeline has authorized access to ingest data and I
can verify or rotate that access later.

#### Acceptance Criteria

1. WHEN a Project has no connector configured THEN the Connector screen SHALL render the
   onboarding layout from `project-connector.md` / `app-shell.md` State 1: an "Install
   GitHub App" primary action and a "Connect Jira" primary action, each with descriptive
   copy, plus a note that OAuth 2.0 scoped tokens are used and raw credentials are never
   stored or returned to the frontend.
2. WHEN a user clicks "Install GitHub App" THEN the system SHALL initiate the GitHub App
   installation handoff (integration-github OAuth flow) and, on return, SHALL reflect the
   updated connector state without requiring a manual page refresh.
3. WHEN a user clicks "Connect Jira" THEN the system SHALL initiate the Atlassian 3LO OAuth
   handshake (integration-jira) and, on return, SHALL reflect the updated connector state
   without requiring a manual page refresh.
4. WHEN a Project has a working connector THEN the Connector screen SHALL render the
   connected layout from `project-connector.md`: separate "GitHub" and "Jira" sections each
   showing a live "Connected"/"Disconnected" status (via `POST .../connector/test`,
   architecture.md Section 7), identifying metadata (installation/account, token version,
   last-rotated time for GitHub; cloud site and Jira space key for Jira), a "Test" action,
   and a "Manage"/"Re-auth" action per source.
5. WHEN a user clicks "Test" for a connector THEN the system SHALL call the connector test
   endpoint and update the displayed status (Connected/Disconnected) based on the response
   without a full page reload.
6. IF a repository defines its own connector override THEN the Repository Settings screen
   (Requirement 10) SHALL be the surface for managing that override; the Project Connector
   screen SHALL continue to represent only the Project-level (default) connector.
7. WHEN the Project Connector's status transitions from "no working connector" to "at least
   one working connector" THEN the system SHALL unlock the sidebar's Settings and
   Repositories sections (Requirement 2.3) without requiring a manual page reload.

### Requirement 4 — Project Settings: Metadata

**User Story:** As a Project admin, I want to view and edit my Project's identity metadata,
so that dashboards and reports show the correct name and description.

#### Acceptance Criteria

1. WHEN a user navigates to Project Settings THEN the system SHALL render the sub-section
   navigation from `project-settings.md`: "Metadata" (enabled), "User Access" (visibly
   present but disabled, labeled post-MVP), "JIRA Workflow Mapping" (enabled), "JIRA
   Configuration" (enabled) — with Metadata active by default.
2. WHEN a user opens the "JIRA Configuration" sub-section THEN the system SHALL render a
   read-only summary of the Project's linked Jira connection (cloud site, space key, and
   live connector status sourced from the same `test_connectivity()` data as Requirement 3)
   with a link that navigates to the Connector screen to manage the underlying connection.
   `project-settings.md` defines no further JIRA Configuration behavior beyond this
   connection summary, so no additional editing controls (e.g., re-scoping the linked space)
   are in scope for this spec.
3. WHEN the Metadata sub-section renders THEN the system SHALL display editable "Project
   name" and "Description" fields pre-populated with the current Project's values, and a
   read-only display of the linked Jira space (cloud site + space key).
4. WHEN a user edits the Project name or Description and clicks "Save" THEN the system SHALL
   submit the changes via the Project update endpoint (`PATCH`-equivalent under
   architecture.md Section 7's Products/Repositories area) and SHALL display a success
   confirmation on completion or a visible error message on failure, leaving the form's
   values unchanged on failure so the user can retry.
5. IF a user attempts to clear the Project name to an empty value THEN the system SHALL
   block submission and display a validation error without calling the API.
6. WHEN a user clicks "User Access" THEN the system SHALL NOT navigate away from Metadata and
   SHALL indicate (e.g., tooltip or inline note) that the feature is not yet available.

### Requirement 5 — Project Settings: JIRA Workflow Mapping

**User Story:** As a Project admin, I want to map my Jira status strings to the six
canonical lifecycle phases, so that downstream analytics can treat every team's workflow
uniformly.

#### Acceptance Criteria

1. WHEN a user navigates to JIRA Workflow Mapping THEN the system SHALL fetch and display
   every known Jira status for the Project's linked space alongside its currently mapped
   canonical phase (one of `backlog`, `ready`, `in_dev`, `str`, `qa`, `done`) or an
   unmapped indicator, matching `project-settings-workflow.md`.
2. WHEN the mapping table renders THEN the system SHALL display a badge summarizing how many
   statuses are mapped versus unmapped (e.g., "6 mapped · 1 unmapped").
3. WHEN a user selects a canonical phase for an unmapped (or remapped) status from a
   selector control THEN the system SHALL stage that change locally without an immediate API
   call.
4. WHEN a user clicks "Infer unmapped" THEN the system SHALL call the workflow-mapping
   inference endpoint (`POST .../workflow-mappings/infer`, architecture.md Section 7) and
   SHALL display each returned suggestion as an inline "inferred: {phase}?" indicator
   requiring explicit user confirmation before it is treated as mapped.
5. WHEN a user clicks "Save" THEN the system SHALL submit all staged mappings via
   `PUT /repositories/{id}/workflow-mappings`-equivalent Project-scoped endpoint and SHALL
   show a success confirmation on completion or a visible error on failure, retaining the
   user's staged edits so they are not lost.
6. IF a status has no phase selected when "Save" is clicked THEN the system SHALL leave that
   status unmapped in the submission rather than defaulting it to a phase, and SHALL NOT
   block the save of the other, mapped statuses.

### Requirement 6 — Repository Landing

**User Story:** As a user, I want to see all Repositories in my current Project as cards
with identity, sync health, and a hero metric, so that I can quickly assess overall health
and jump into any repository.

#### Acceptance Criteria

1. WHEN a user navigates to Repository Landing THEN the system SHALL render one card per
   Repository in the current Project, each showing the repository name, its GitHub identity
   (`owner/repo`), a sync-health status indicator, last-synced relative time (or an
   in-progress indicator for a first sync), and a hero metric slot, matching
   `repository-landing.md`.
2. WHEN a repository's sync run is in a non-terminal state THEN its card SHALL display a
   spinner and "First sync in progress" (or equivalent in-progress copy) instead of a
   last-synced time, and SHALL update automatically via polling when the run reaches a
   terminal state (`completed`/`failed`, architecture.md Section 8) without requiring a
   manual refresh.
3. WHEN a user types into the "Search repositories..." field THEN the system SHALL filter
   the displayed cards to those whose name or identity matches the query, updating as the
   user types.
4. WHEN a user clicks "Add Repository" (either the sidebar action or the landing page
   action, or the dedicated "Add repository" card) THEN the system SHALL present a form
   collecting, at minimum, `key` (unique within the Project), `display_name`,
   `github_owner`, `github_repo`, `jira_project_key`, and `ticket_key_pattern` (per the
   `repositories` table, architecture.md Section 4.1), submit it via `POST /repositories`,
   and, on success, SHALL display the new repository's card without requiring a full page
   reload.
5. IF a user submits the "Add Repository" form with a `key` that collides with an existing
   Repository in the Project THEN the system SHALL surface the resulting `409 Conflict`
   response (`UNIQUE(product_id, key)`) as a clear, field-level validation error and SHALL
   NOT add a duplicate card.
6. IF a user submits the "Add Repository" form with a required field left blank THEN the
   system SHALL block submission and display a validation error without calling the API.
7. WHEN a user clicks a repository card THEN the system SHALL navigate to that repository's
   workspace defaulting to its Dashboard tab.
8. WHEN the current Project has zero Repositories THEN Repository Landing SHALL render only
   the "Add repository" card (no repository cards, no search field results to show) with
   copy inviting the user to connect a repository, matching the empty-state composition
   implied by `repository-landing.md`.

### Requirement 7 — Repository Workspace: Dashboard Tab

**User Story:** As a user, I want a live dashboard for a repository showing key metrics and
signals, so that I can assess its current engineering health at a glance.

#### Acceptance Criteria

1. WHEN a user opens a repository's Dashboard tab THEN the system SHALL render the
   repository identity header (name, `owner/repo`, sync status, last-synced time, "Sync"
   action) and the three-tab navigation (Dashboard active, Reports, Settings), matching
   `repository-dashboard.md`.
2. WHEN the Dashboard tab renders THEN the system SHALL display a hero metric strip of
   metric cards sourced from the Gold-tier `metric_fact` data (via the repository stats
   endpoint, architecture.md Section 7 `GET /repositories/{id}/stats`), a primary
   visualization area, a "Signals" panel reflecting current drift signals, and a
   "Secondary" placeholder panel reserved for future ambient content, matching
   `repository-dashboard.md`; the Secondary panel renders as an empty/placeholder card in
   this phase with no data-fetching behavior of its own.
3. WHEN a user clicks "Sync" THEN the system SHALL trigger a new sync run
   (`POST /repositories/{id}/sync`), disable the action while a run is in flight, and poll
   `GET .../sync/runs/{run_id}` (or the latest run) until it reaches a terminal state,
   updating the displayed sync status and last-synced time live.
4. IF the repository has no computed facts yet (e.g., first sync not complete) THEN the
   dashboard SHALL display an empty/placeholder state for the metric strip and
   visualization rather than an error.
5. WHEN metric or signal data fails to load THEN the system SHALL display a visible,
   dismissable error state in the affected panel without crashing the rest of the page.

### Requirement 8 — Repository Workspace: Reports Tab

**User Story:** As a user, I want to see and generate time-bound editorial reports for a
repository, so that I can review a periodic brief of engineering activity.

#### Acceptance Criteria

1. WHEN a user opens a repository's Reports tab THEN the system SHALL fetch and render one
   card per `async_reports` job (`GET /repositories/{id}/reports`) showing report type,
   period, status, and status-specific details, matching `repository-reports.md`.
2. WHEN a report's status is `completed` THEN its card SHALL show a completion time and
   signal count, an "Open" action that navigates to the Report Viewer (Requirement 9) for
   that report, and a secondary "gear" icon action that opens a small menu of report-level
   management actions (at minimum, delete via `DELETE /repositories/{id}/reports/{id}`); a
   deleted report SHALL be removed from the grid without a full page reload.
3. WHEN a report's status is a non-terminal, in-progress state THEN its card SHALL show a
   spinner, a progress indicator, and its current stage, and SHALL poll
   `GET .../reports/{id}/status` (architecture.md Section 8) at the surface's chosen cadence
   until the report reaches a terminal state, updating the card automatically without a
   manual refresh.
4. WHEN a report's status is `failed` THEN its card SHALL show a "Failed" indicator, the
   retry count, a "View error" action, and a "Retry" action that re-triggers generation.
5. WHEN a user clicks "Generate report" THEN the system SHALL present a control to pick a
   report type and period, and on confirmation SHALL call `POST /repositories/{id}/reports`;
   IF an equivalent report (same product, repo, report_type, period) already exists THEN the
   system SHALL surface the resulting `409 Conflict` response as a clear message rather than
   creating a duplicate card.
6. WHEN a user clicks "Filter" THEN the system SHALL present controls to filter the
   displayed reports (e.g., by status or report type) and SHALL apply the filter to the
   rendered grid without an additional network request when the already-fetched data
   supports it.

### Requirement 9 — Report Viewer

**User Story:** As a user, I want to read a completed report's editorial brief — KPIs and
fired signals with evidence — so that I understand what changed and why it matters.

#### Acceptance Criteria

1. WHEN a user opens a completed report THEN the system SHALL render the report header
   (title, status, period label, generated-time), a breadcrumb ending in the report's period
   label, KPI cards showing metric values with a "vs prev period" comparison, and a "This
   period's signals" section listing each fired `report_signal`, matching
   `report-viewer.md`.
2. WHEN a signal is displayed THEN its card SHALL show a severity chip (e.g., High / Medium /
   Low), a narrative description, and an "Evidence" panel reflecting the frozen
   `report_signal.evidence` payload (fact ids/values as recorded at generation time, not
   recomputed live).
3. WHEN a user clicks "‹ Prev" or "Next ›" THEN the system SHALL navigate to the
   chronologically adjacent report of the same report type for the same repository, if one
   exists, and SHALL disable/hide the control at either boundary when no adjacent report
   exists.
4. WHEN a user clicks "Regenerate" THEN the system SHALL call `POST /repositories/{id}/reports`
   for the same report type and period and SHALL navigate to (or update in place) the
   resulting job's progress view per Requirement 8.3 semantics.
5. IF a user opens a report whose status is not `completed` (e.g., navigated directly via
   URL while generation is still in progress) THEN the Report Viewer SHALL render the
   generation-progress view (polling `GET .../reports/{id}/status`) instead of the completed
   brief layout, and SHALL switch to the brief layout automatically once the poll reports
   `completed`.
6. WHEN report data fails to load (e.g., `404` for a deleted report) THEN the system SHALL
   display a clear error state with a way to navigate back to the Reports tab.

### Requirement 10 — Repository Workspace: Settings Tab (Clusters & Connector Override)

**User Story:** As a user, I want to manage a repository's code-area clusters and its
connector override, so that per-repository analytics reflect my team's actual code
organization and access needs.

#### Acceptance Criteria

1. WHEN a user opens a repository's Settings tab THEN the system SHALL render sub-section
   navigation for "Clusters" (default active) and "Connector override", matching
   `repository-settings.md`.
2. WHEN the Clusters sub-section renders THEN the system SHALL display a table of clusters
   (`GET /repositories/{id}/clusters`) showing name, file pattern, curation status
   (`auto`/`confirmed`/`renamed`/`manual`/`archived`) as a distinctly styled chip, and file
   count, with a badge summarizing the active cluster count.
3. WHEN a user clicks "Add Cluster" THEN the system SHALL present a form to create a cluster
   (`POST /repositories/{id}/clusters`) and, on success, SHALL add it to the displayed table
   without a full page reload.
4. WHEN a user edits an existing cluster's name or pattern and saves THEN the system SHALL
   call `PATCH /repositories/{id}/clusters/{cluster_id}` and SHALL reflect the updated values
   in the table on success or show an error on failure.
5. WHEN a user clicks "Recompute" THEN the system SHALL call
   `POST /repositories/{id}/clusters/recompute` and SHALL display a confirmation that
   human-curated clusters (`confirmed`/`renamed`/`manual`) are never overwritten by
   recompute, consistent with architecture.md Section 4.2.
6. WHEN a user clicks "Import JSON" THEN the system SHALL present a way to supply a JSON
   payload and submit it to `POST /repositories/{id}/clusters/import`, showing success or a
   validation/error message on failure.
7. WHEN a user opens the "Connector override" sub-section THEN the system SHALL render the
   repository-level connector management UI (structurally analogous to Requirement 3,
   scoped to `GET/PUT/POST(test)/DELETE /repositories/{id}/connector`) and SHALL indicate
   whether the repository is currently using its own override or falling back to the
   Project-level connector.

### Requirement 11 — Global Sync Events

**User Story:** As a user, I want a global view of in-flight and recent sync/job events, so
that I can track background work without leaving my current screen.

#### Acceptance Criteria

1. WHEN a user clicks the topbar "Sync events" action THEN the system SHALL open a panel
   listing recent sync runs, aggregation runs, and report jobs for the current Project,
   each with its type, scope (repository), status, and relative time.
2. WHEN a listed event is in a non-terminal state THEN the system SHALL poll its status
   source (sync run, `metric_run`, or `async_reports`, per architecture.md Section 8) and
   update the event's displayed status live until it reaches a terminal state.
3. WHEN the topbar "Sync events" badge is displayed THEN its numeric value SHALL equal the
   count of currently non-terminal events for the current Project, updating automatically as
   events complete.
4. WHEN a user clicks a specific event in the panel THEN the system SHALL navigate to the
   most relevant screen for that event (e.g., a report event navigates to the Report Viewer
   or Reports tab; a sync event navigates to the relevant repository's Dashboard).

### Requirement 12 — Polling Behavior (Cross-Cutting)

**User Story:** As a user, I want status displays to update automatically and efficiently
without excessive network traffic or battery drain, so that the app feels responsive without
being wasteful.

#### Acceptance Criteria

1. WHEN a polling hook observes its subject reach a terminal state (`completed` or `failed`)
   THEN the system SHALL stop polling that subject and rely on the final fetched state.
2. WHEN the browser tab becomes hidden THEN the system SHALL pause active polling for all
   subjects and SHALL resume polling immediately upon the tab becoming visible again.
3. WHEN a polling hook targets an actively-running job (sync run, `metric_run`, or
   `async_reports` in progress) THEN the system SHALL poll at a short cadence (a few
   seconds) as specified per surface in architecture.md Section 8.
4. WHEN a polling hook targets ambient, non-time-critical dashboard data (e.g., a repository
   card's hero metric on the landing page when nothing is actively running) THEN the system
   SHALL poll at a materially slower cadence than active-job polling.
5. IF a polled endpoint returns an error THEN the system SHALL surface a visible error state
   for that subject and SHALL continue retrying at its configured cadence (or back off)
   rather than silently freezing on stale data with no indication.

### Requirement 13 — Error Handling & Loading States (Cross-Cutting)

**User Story:** As a user, I want clear loading and error feedback throughout the app, so
that I always know whether data is current, loading, or unavailable.

#### Acceptance Criteria

1. WHEN any screen's primary data is being fetched for the first time THEN the system SHALL
   display a loading indicator appropriate to that screen's layout (skeleton, spinner, or
   placeholder) rather than a blank or broken layout.
2. WHEN a REST call fails with a 4xx/5xx response THEN the system SHALL display a
   human-readable error message distinct from the loading state, without leaking raw
   stack traces or internal error payloads to the UI.
3. WHEN a REST call fails due to network unavailability THEN the system SHALL display an
   error state indicating connectivity failure distinct from a server-side error.
4. IF a user retries a failed action (e.g., re-clicking "Save" or a retry control) THEN the
   system SHALL re-attempt the operation and clear the prior error state upon success.

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Each file under `frontend/src/` has one well-defined
  purpose — a service file owns wire types and fetch calls for one API resource; a hook file
  owns loading/error/polling state for one data concern; a feature composes hooks and
  components into a page.
- **Modular Design**: `app/` (routes, guards), `contexts/` (current Project, repository
  list — the only cross-cutting state), `features/` (onboarding, dashboard, reportViewer,
  settings, etc.), `hooks/`, `services/`, `theme/`, and `types/` remain isolated per
  architecture.md Section 9; no feature reaches into another feature's internals.
- **Dependency Management**: Components depend on hooks; hooks depend on services; services
  depend on nothing else in `src/`. No global state library is introduced — only the two
  cross-cutting contexts (current Project, repository list) hold shared state.
- **Clear Interfaces**: Every service exports typed request/response contracts; every hook
  exports a typed return shape (data, loading, error, and, where relevant, polling status).

### Performance
- Screens SHALL render their primary layout (chrome + loading state) within 1 second on a
  broadband connection, independent of backend response time.
- Polling SHALL NOT run concurrently against the same subject from multiple mounted
  components; a shared cache (TanStack Query) SHALL de-duplicate identical in-flight
  requests.
- Active-job polling cadence SHALL be a few seconds; ambient dashboard polling cadence SHALL
  be materially slower (tens of seconds or more), per architecture.md Section 8.

### Security
- The frontend SHALL never store, request, or display raw GitHub/Jira credentials or tokens;
  only connector status and non-secret metadata (installation id, token version, last-rotated
  time, cloud site, space key) are rendered, consistent with architecture.md Section 10.
- All REST calls SHALL include the Cognito-issued identity token; the frontend SHALL make no
  unauthenticated calls to tenant-scoped endpoints.
- The frontend SHALL treat the current Project as the sole tenancy anchor for every request
  it issues or route it renders; it SHALL NOT allow a user to view data for a Project they do
  not belong to.

### Reliability
- A transient failure in one panel/section (e.g., the Signals panel on the Dashboard) SHALL
  NOT crash or block rendering of the rest of the page (per-section error boundaries).
- Polling hooks SHALL correctly resume after the tab regains visibility and SHALL not leak
  intervals/timers across component unmount.

### Usability
- Every screen SHALL visually match the structure (chrome, sections, controls) defined in its
  corresponding `apps/frontend/docs/wireframes_v2/*.md` wireframe, including its paired SVG
  where the DSL text is ambiguous about layout.
- Locked/disabled UI (onboarding-pending sidebar sections, the post-MVP User Access
  sub-section) SHALL be visually distinguishable from enabled UI and SHALL NOT be reachable
  via direct navigation while locked.
