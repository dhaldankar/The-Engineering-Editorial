# Tasks Document

## Phase 0 — Project Scaffolding

- [ ] 0.1 Scaffold the Vite + React + TypeScript project in apps/frontend
  - File: apps/frontend/package.json (extend), apps/frontend/vite.config.ts, apps/frontend/tsconfig.json, apps/frontend/tsconfig.node.json, apps/frontend/index.html, apps/frontend/src/main.tsx, apps/frontend/vitest.config.ts
  - Add dependencies: react, react-dom, react-router-dom, @tanstack/react-query, @mui/material, @emotion/react, @emotion/styled, @mui/icons-material, aws-amplify; devDependencies: typescript, vite, @vitejs/plugin-react, vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @types/react, @types/react-dom
  - Do not remove or modify the existing "wireloom" script/devDependency
  - Purpose: Establish the buildable, testable Vite + TS + React skeleton that every later task builds on, per docs/architecture.md Section 9 ("React + TypeScript, built with Vite")
  - _Leverage: apps/frontend/package.json (existing, extend only), apps/frontend/scripts/wireloom-svg.js (untouched)_
  - _Requirements: NFR Code Architecture and Modularity_
  - _Prompt: Role: Frontend Build Engineer specializing in Vite + TypeScript + React project setup | Task: Scaffold apps/frontend as a Vite + React + TypeScript SPA, extending the existing package.json (do not touch its "wireloom" script or devDependency) with the exact dependency set listed above, add vite.config.ts, tsconfig.json/tsconfig.node.json, index.html, src/main.tsx (a minimal placeholder that will be filled in by later tasks), and vitest.config.ts wired for jsdom + React Testing Library | Restrictions: Do not create any feature code yet, do not delete apps/frontend/docs or apps/frontend/scripts, keep the wireloom script functional | Success: `npm install` and `npm run build` succeed from apps/frontend, `npm run test` runs (even with zero tests) via Vitest, TypeScript strict mode is enabled_

- [ ] 0.2 Create the folder skeleton for frontend/src per architecture.md Section 9
  - File: apps/frontend/src/{app,contexts,features,hooks,services,theme,types,utils,components}/.gitkeep (or an index.ts stub per folder)
  - Purpose: Establish the mandated folder layout (app/ contexts/ features/ hooks/ services/ theme/ types/) plus the two supporting folders (utils/, components/) called out in design.md, before any feature code lands
  - _Leverage: None — greenfield_
  - _Requirements: NFR Code Architecture and Modularity_
  - _Prompt: Role: Frontend Architect enforcing project structure conventions | Task: Create the empty folder skeleton frontend/src/{app,contexts,features,hooks,services,theme,types,utils,components} exactly matching the layout in design.md's "Detailed Folder Structure" section, with a placeholder file in each empty folder so it is tracked by git | Restrictions: Do not add any implementation code in this task, do not deviate from the folder names given in design.md | Success: The folder tree matches design.md exactly; no folder is empty in a way that would be dropped by git_

## Phase 1 — Core Infrastructure: API Client, Types, Theme, Auth, Routing Shell

- [ ] 1.1 Define shared TypeScript model types in src/types/
  - File: apps/frontend/src/types/product.ts, repository.ts, connector.ts, cluster.ts, workflowMapping.ts, syncRun.ts, metricRun.ts, report.ts, signal.ts, reviewLens.ts, contributor.ts, account.ts
  - Define the DTO shapes exactly as specified in design.md's "Data Models and Service Mapping" section (RepositoryDTO, SyncRunDTO, MetricRunDTO, AsyncReportDTO, ReportSignalDTO, ClusterDTO, WorkflowMappingDTO, ConnectorDTO, plus Product/Account/Contributor/ReviewLens shapes implied by architecture.md Section 7)
  - Purpose: Establish type safety across services/hooks/features before any of them are implemented
  - _Leverage: None — greenfield_
  - _Requirements: NFR Code Architecture and Modularity (Clear Interfaces)_
  - _Prompt: Role: TypeScript Developer specializing in domain modeling | Task: Create one types file per domain concept listed above, defining the DTO interfaces exactly as specified in design.md's "Data Models and Service Mapping" section, covering every field named there (e.g. RepositoryDTO.status as a union of 'onboarding'|'syncing'|'synced'|'error', AsyncReportDTO.status as 'pending'|'generating'|'completed'|'failed', WorkflowMappingDTO.phase as the six canonical phases plus null) | Restrictions: Do not add fields not implied by architecture.md Sections 4 and 7 or by design.md's data model section, do not put React or fetch code in these files, keep each file single-purpose | Success: All files compile with strict TypeScript, every union type matches the terminal/non-terminal states named in architecture.md Section 8, no circular imports between type files_

- [ ] 1.2 Implement the shared apiClient with Cognito token attachment
  - File: apps/frontend/src/services/apiClient.ts
  - Implement `apiFetch<T>(path, init?)` that resolves a base URL from environment config, calls `fetchAuthSession()` from aws-amplify/auth to obtain the current identity token, attaches it as `Authorization: Bearer <token>`, serializes request bodies as JSON, parses JSON responses, and throws a typed `ApiError` (status, code, body) on non-2xx responses or network failure (status 0 / code NETWORK_ERROR)
  - Purpose: Single choke point for every REST call to the API surface in architecture.md Section 7, implementing Requirement 1.2 (token attachment) and the network/HTTP error distinction needed by Requirement 13.2/13.3
  - _Leverage: apps/frontend/src/types (for shared error shape if introduced there)_
  - _Requirements: 1.2, 13.2, 13.3_
  - _Prompt: Role: Frontend Developer specializing in API client design and AWS Amplify integration | Task: Implement services/apiClient.ts exposing `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` and an `ApiError` class (status: number, code: string, body: unknown, message: string) per design.md's apiClient section, attaching the Cognito token from Amplify's fetchAuthSession() as an Authorization header on every call, and distinguishing a network-level failure (status 0) from an HTTP error response (real status code) so Requirement 13.2 and 13.3 can render different messages | Restrictions: Do not import React here, do not swallow errors silently, never log or expose the raw token, do not hardcode a base URL — read it from an env var (e.g. import.meta.env.VITE_API_BASE_URL) | Success: Unit tests (task 1.2b) pass covering 2xx success, 4xx/5xx ApiError shape, 401 special case, and network-failure ApiError shape_

- [ ] 1.2b Write unit tests for apiClient
  - File: apps/frontend/src/services/apiClient.test.ts
  - Mock global fetch and aws-amplify/auth's fetchAuthSession; test success path, 4xx/5xx error path, 401 path, and network-failure path
  - Purpose: Guarantee the one shared network choke point behaves correctly before every other service depends on it
  - _Leverage: apps/frontend/src/services/apiClient.ts_
  - _Requirements: 1.2, 13.2, 13.3_
  - _Prompt: Role: QA Engineer specializing in Vitest and fetch mocking | Task: Write apiClient.test.ts covering: (1) a successful call attaches the Authorization header and returns parsed JSON, (2) a 4xx/5xx response throws ApiError with the correct status/body, (3) a 401 response throws ApiError{status:401}, (4) a rejected fetch (network failure) throws ApiError with status 0 / code NETWORK_ERROR | Restrictions: Mock fetch and Amplify's auth module only, do not hit a real network, do not test React-layer error handling here (that belongs to later hook/feature tests) | Success: All four scenarios pass in isolation and re-run deterministically_

- [ ] 1.3 Implement productsService and repositoriesService
  - File: apps/frontend/src/services/productsService.ts, apps/frontend/src/services/repositoriesService.ts
  - productsService: getCurrentProduct() → GET /products/current, listProducts() → GET /products, updateCurrentProduct(patch) → PATCH-equivalent on /products/current
  - repositoriesService: listRepositories() → GET /repositories, getRepository(id) → GET /repositories/{id}, createRepository(input) → POST /repositories, updateRepository(id, patch) → PATCH /repositories/{id}, deleteRepository(id) → DELETE /repositories/{id}, getRepositoryStats(id) → GET /repositories/{id}/stats
  - Purpose: Cover the Products/Repositories endpoint group (architecture.md Section 7) needed by ProjectSwitcher, MetadataPanel, RepositoryLandingPage, RepositoryHeader, DashboardPage
  - _Leverage: apps/frontend/src/services/apiClient.ts, apps/frontend/src/types/product.ts, apps/frontend/src/types/repository.ts_
  - _Requirements: 2.6, 4.4, 6.1, 6.4, 6.5, 6.6, 7.1, 7.2_
  - _Prompt: Role: Frontend Developer specializing in typed REST service layers | Task: Implement productsService.ts and repositoriesService.ts exposing the functions listed above, each a thin wrapper over apiClient.apiFetch, matching exactly the endpoints in architecture.md Section 7's "Products / Repositories" row, with createRepository accepting the full field set from Requirement 6.4 (key, display_name, github_owner, github_repo, jira_project_key, ticket_key_pattern) | Restrictions: Do not add business logic or React state here, do not swallow the 409 conflict on createRepository — let ApiError propagate for the hook layer to interpret, keep one function per endpoint | Success: Each function has a corresponding unit test mocking apiFetch and asserting the correct path/method/body is constructed_

- [ ] 1.4 Implement connectorService, clustersService, workflowMappingService, syncService
  - File: apps/frontend/src/services/connectorService.ts, clustersService.ts, workflowMappingService.ts, syncService.ts
  - connectorService: getConnector(scope, id?), putConnector(scope, id?, input), testConnector(scope, id?), deleteConnector(scope, id?) covering both `/products/current/connector` and `/repositories/{id}/connector`
  - clustersService: listClusters(repoId), createCluster(repoId, input), updateCluster(repoId, clusterId, patch), recomputeClusters(repoId), importClusters(repoId, payload), deleteClusterData(repoId)
  - workflowMappingService: getMappings(), putMappings(mappings), inferMappings(), getStatuses()
  - syncService: getSyncRuns(repoId), getSyncRun(repoId, runId), triggerSync(repoId)
  - Purpose: Cover the Connectors, Clusters, Workflow mapping, and Sync endpoint groups from architecture.md Section 7
  - _Leverage: apps/frontend/src/services/apiClient.ts, apps/frontend/src/types/connector.ts, cluster.ts, workflowMapping.ts, syncRun.ts_
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.1, 5.4, 5.5, 7.3, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  - _Prompt: Role: Frontend Developer specializing in typed REST service layers | Task: Implement the four service files exposing the functions listed above, matching architecture.md Section 7's "Connectors", "Clusters", "Workflow mapping", and "Sync" rows exactly, with connectorService supporting both product-scoped and repository-scoped calls (repository → product fallback is a backend concern, but the service must accept a scope parameter to hit the right path) | Restrictions: Do not implement the repository → product fallback logic client-side (that's the backend's resolution rule per architecture.md Section 4.3, not the frontend's), keep one function per endpoint, do not add polling/refetch logic here (that belongs in hooks) | Success: Each function has a unit test verifying correct path construction for both product-scoped and repo-scoped connector calls, and for every clusters/workflow-mapping/sync endpoint_

- [ ] 1.5 Implement reportsService, signalsService, and stub reviewLensService/contributorsService
  - File: apps/frontend/src/services/reportsService.ts, signalsService.ts, reviewLensService.ts, contributorsService.ts
  - reportsService: listReports(repoId), createReport(repoId, input), getReport(repoId, reportId), deleteReport(repoId, reportId), getReportData(repoId, reportId), getReportStatus(repoId, reportId)
  - signalsService: getSignals(repoId), putSignals(repoId, config)
  - reviewLensService and contributorsService: typed function stubs only, covering every endpoint listed in architecture.md Section 7's "Review Lens" and "Contributors" rows, per design.md's note that no wireframed screen in this phase consumes them
  - Purpose: Complete the Reports/Signals endpoint groups needed by Reports tab and Report Viewer, and provide forward-compatible, typed (but unused) stubs for Review Lens / Contributors per design.md's explicit scoping note
  - _Leverage: apps/frontend/src/services/apiClient.ts, apps/frontend/src/types/report.ts, signal.ts, reviewLens.ts, contributor.ts_
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.4, 9.5, 9.6_
  - _Prompt: Role: Frontend Developer specializing in typed REST service layers | Task: Implement reportsService.ts and signalsService.ts fully per architecture.md Section 7's "Reports" and "Signals" rows, and implement reviewLensService.ts / contributorsService.ts as typed function stubs (correct signatures and return types, thin apiFetch wrappers) covering the "Review Lens" and "Contributors" endpoint rows, per design.md's explicit note that these two services are included for API-surface completeness but are not wired to any UI in this phase | Restrictions: Do not build any hooks or components consuming reviewLensService/contributorsService in this task — stub the service layer only, do not omit the 409-idempotency case on createReport (`UNIQUE(product_id, repo_id, report_type, period)`) — let the conflict propagate as ApiError | Success: reportsService/signalsService functions are unit-tested; reviewLensService/contributorsService compile with correct types and have at least a smoke test asserting the right path is called_

- [ ] 1.6 Build the MUI theme and status-color tokens
  - File: apps/frontend/src/theme/theme.ts, apps/frontend/src/theme/statusColors.ts
  - Define an MUI `createTheme()` covering palette, typography, and shape tokens, plus a status→color mapping function for the wireframes' `accent=`/`kind=` vocabulary (success, warning, danger, research)
  - Purpose: Provide the single styling source every component in every feature consumes, per architecture.md Section 9's `theme/` folder and design.md's MUI theming approach
  - _Leverage: None — greenfield_
  - _Requirements: NFR Usability_
  - _Prompt: Role: Frontend Developer specializing in MUI theming | Task: Create theme.ts exporting an MUI theme object and statusColors.ts exporting a function mapping the wireframes' status vocabulary (success/warning/danger/research, as seen across app-shell.md, repository-landing.md, repository-reports.md, repository-settings.md, report-viewer.md) to concrete MUI palette colors, so every StatusChip/status badge across the app derives its color from one place | Restrictions: Do not hardcode colors inline in feature components — all status coloring must go through statusColors.ts, keep the theme file free of component-specific logic | Success: theme.ts is consumed by a ThemeProvider in main.tsx (task 1.9) without type errors; statusColors.ts has a unit test asserting each of the four wireframe accent kinds maps to a distinct, defined color_

- [ ] 1.7 Implement shared presentational components
  - File: apps/frontend/src/components/StatusChip.tsx, MetricCard.tsx, EmptyState.tsx, ErrorState.tsx, LoadingSkeleton.tsx, SectionErrorBoundary.tsx
  - Purpose: Provide the reusable primitives referenced by nearly every feature (status chips, metric slots, empty/error/loading states, and a per-panel error boundary satisfying Requirement 7.5/13.1-13.3 and the Reliability NFR)
  - _Leverage: apps/frontend/src/theme/statusColors.ts_
  - _Requirements: 6.1, 7.5, 13.1, 13.2, 13.3, NFR Reliability_
  - _Prompt: Role: React Developer specializing in reusable component libraries with MUI | Task: Implement the six shared components listed above: StatusChip (wraps MUI Chip using statusColors.ts), MetricCard (value + label + optional "vs prev period" comparison text, matching the metric slots in repository-dashboard.md and report-viewer.md), EmptyState, ErrorState (accepts a message and distinguishes network vs. server error styling per Requirement 13.2/13.3), LoadingSkeleton (MUI Skeleton-based), and SectionErrorBoundary (a React error boundary class/component isolating a single panel's render failure without unmounting siblings, satisfying Requirement 7.5) | Restrictions: These components must not perform data fetching themselves, must accept all displayed data via props, and must not import any feature-specific service or hook | Success: Each component has a render test (React Testing Library) covering its documented prop variants; SectionErrorBoundary has a test proving a thrown error in a child does not propagate past the boundary_

- [ ] 1.8 Implement CurrentProductContext and RepositoryListContext
  - File: apps/frontend/src/contexts/CurrentProductContext.tsx, apps/frontend/src/contexts/RepositoryListContext.tsx
  - CurrentProductContext: holds `{ product: ProductDTO | null, setProductId }`, backed by productsService.getCurrentProduct()/listProducts()
  - RepositoryListContext: holds `{ repositories: RepositoryDTO[] }`, backed by repositoriesService.listRepositories()
  - Purpose: Implement the only two cross-cutting state concerns permitted by architecture.md Section 9 ("no global state library... context covers only the two genuinely cross-cutting concerns")
  - _Leverage: apps/frontend/src/services/productsService.ts, repositoriesService.ts_
  - _Requirements: 2.6, NFR Code Architecture and Modularity_
  - _Prompt: Role: React Developer specializing in Context API and TanStack Query integration | Task: Implement CurrentProductContext.tsx and RepositoryListContext.tsx as described, each exposing a Provider component and a typed consumer hook (useCurrentProduct, useRepositoryList per design.md), internally backed by TanStack Query calls to the respective service so the context always reflects live cached data rather than duplicating fetch logic | Restrictions: Do not introduce a third context or any global state library, do not put polling logic in these contexts (that belongs to dedicated hooks), keep each context file single-purpose | Success: A test wrapping a consumer component in each Provider correctly reflects mocked service data and updates when setProductId is called_

- [ ] 1.9 Wire main.tsx: Amplify config, QueryClientProvider, ThemeProvider, RouterProvider
  - File: apps/frontend/src/main.tsx
  - Configure Amplify with Cognito settings from environment variables, instantiate a `QueryClient`, wrap the app in `QueryClientProvider`, `ThemeProvider` (theme.ts), the two contexts (task 1.8), and render `AppRouter` (task 1.11)
  - Purpose: Bootstrap the whole application shell exactly once
  - _Leverage: apps/frontend/src/theme/theme.ts, contexts/CurrentProductContext.tsx, contexts/RepositoryListContext.tsx, app/AppRouter.tsx_
  - _Requirements: 1.2, 1.4_
  - _Prompt: Role: Frontend Build Engineer specializing in React app bootstrapping | Task: Implement main.tsx to call Amplify.configure() with Cognito User Pool settings read from Vite env vars, create a TanStack QueryClient with sensible defaults (retry policy that does not retry 401s, per Requirement 1.3), and render the full provider tree (QueryClientProvider > ThemeProvider > CurrentProductProvider > RepositoryListProvider > AppRouter) into the DOM | Restrictions: Do not hardcode Cognito pool/client ids — read from import.meta.env, do not add route or feature logic directly in main.tsx | Success: The app boots to the login screen when unauthenticated and to the app shell when authenticated, verified by an integration test in task 1.13_

- [ ] 1.10 Implement RequireAuth guard and LoginPage
  - File: apps/frontend/src/app/RequireAuth.tsx, apps/frontend/src/features/auth/LoginPage.tsx
  - RequireAuth: checks Amplify session via fetchAuthSession()/getCurrentUser(); redirects unauthenticated users to /login preserving the intended path; renders children/Outlet when authenticated
  - LoginPage: renders an Amplify Authenticator-based login UI
  - Purpose: Implement Requirement 1.1-1.5 and 2.8 (auth gating for every route)
  - _Leverage: aws-amplify/auth_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.8_
  - _Prompt: Role: Frontend Developer specializing in AWS Amplify Auth integration with react-router-dom | Task: Implement RequireAuth.tsx as a route wrapper that blocks rendering of protected content and redirects to /login (preserving the originally-requested path so post-login navigation returns the user there, per Requirement 1.2) when no valid Cognito session exists, restores the session on reload without re-prompting when Amplify's persisted credentials are still valid (Requirement 1.4), and implement LoginPage.tsx using Amplify's Authenticator component; also implement a sign-out action (used by the Topbar in a later task) that clears the Amplify session and calls queryClient.clear() (Requirement 1.5) | Restrictions: Do not implement custom Cognito UI from scratch — use Amplify's provided Authenticator, do not fetch any tenant-scoped data from LoginPage | Success: An integration test shows an unauthenticated render redirects to /login, and a mocked-authenticated render passes through to children; a second test shows a 401 from a query triggers session clear + redirect (ties into task 1.9's QueryClient config)_

- [ ] 1.11 Implement useConnectorStatus hook and RequireConnector guard
  - File: apps/frontend/src/hooks/useConnectorStatus.ts, apps/frontend/src/app/RequireConnector.tsx
  - useConnectorStatus(scope, id?): useQuery wrapping connectorService.testConnector, returning whether the current Project (or repository) has at least one working connector
  - RequireConnector: redirects to /connector when useConnectorStatus indicates no working connector
  - Purpose: Implement Requirement 2.9 (locked-route redirect) and Requirement 3.7 (unlock on connector transition)
  - _Leverage: apps/frontend/src/services/connectorService.ts_
  - _Requirements: 2.2, 2.9, 3.7_
  - _Prompt: Role: React Developer specializing in TanStack Query and route guards | Task: Implement useConnectorStatus.ts as a useQuery hook returning { connected: boolean, isLoading, error } for the product-level connector, and RequireConnector.tsx as a route wrapper that renders <Navigate to="/connector" replace /> when connected is false and isLoading is false, otherwise renders a loading state then children/Outlet once resolved | Restrictions: Do not hardcode a polling interval here — connector status is checked on navigation/mount, not continuously polled (it is a runtime test_connectivity() call, not a poll surface per architecture.md Section 8), do not conflate this hook with the three poll-surface hooks built in Phase 2 | Success: A test shows RequireConnector redirects when the mocked hook returns connected:false and renders children when true; a second test shows that once the underlying query's cached value flips to true (simulating Requirement 3.7's live transition), a previously-redirected route becomes reachable without a full reload_

- [ ] 1.12 Implement AppRouter and routePaths
  - File: apps/frontend/src/app/AppRouter.tsx, apps/frontend/src/app/routePaths.ts
  - Define the full route tree from design.md's "AppRouter" section: /login, / (RequireAuth → AppShell), /connector, /settings/* (RequireConnector), /repositories, /repositories/:repoId/* (RequireConnector)
  - Purpose: Wire every guard and every feature page (as they land in later phases) into one route tree
  - _Leverage: apps/frontend/src/app/RequireAuth.tsx, RequireConnector.tsx_
  - _Requirements: 2.3, 2.4, 2.5, 2.8, 2.9_
  - _Prompt: Role: Frontend Architect specializing in react-router-dom route design | Task: Implement AppRouter.tsx defining the exact route tree in design.md's AppRouter section using react-router-dom's data router (createBrowserRouter) or nested <Routes>, wiring RequireAuth around the whole authenticated tree and RequireConnector around /settings, /repositories, and /repositories/:repoId/* subtrees; implement routePaths.ts exporting typed path-building functions (e.g. repositoryDashboardPath(repoId)) so features never hardcode path strings; leave feature page components as lazy-loaded placeholders wherever they have not yet been implemented by an earlier task, to be filled in by later phase tasks | Restrictions: Do not implement any feature page content here, do not duplicate guard logic — reuse RequireAuth/RequireConnector as wrapper routes | Success: The route tree renders without errors with placeholder pages; navigating to a RequireConnector-guarded path while onboarding-pending redirects to /connector (test using a mocked connector hook)_

- [ ] 1.13 Write integration test for the bootstrapped shell (auth + connector gating)
  - File: apps/frontend/src/app/AppRouter.integration.test.tsx
  - Purpose: Prove the full guard chain (unauthenticated → login; authenticated + onboarding-pending → /connector; authenticated + connected → requested route) works end-to-end at the component-tree level before any feature screens are built
  - _Leverage: apps/frontend/src/app/AppRouter.tsx, RequireAuth.tsx, RequireConnector.tsx, test utilities from task 1.2b's mocking patterns_
  - _Requirements: 1.1, 1.3, 2.8, 2.9_
  - _Prompt: Role: QA Engineer specializing in React Testing Library integration tests | Task: Write an integration test that renders AppRouter inside a MemoryRouter/QueryClientProvider test harness under three scenarios: (1) no Amplify session → redirected to /login, (2) session present but connector mocked as disconnected, navigating to /repositories → redirected to /connector, (3) session present and connector mocked as connected, navigating to /repositories → the (placeholder) Repository Landing route renders | Restrictions: Mock Amplify auth and the connector service only — do not hit real network, do not test individual feature page content here (that belongs to each feature's own tests in later phases) | Success: All three scenarios pass and clearly document the guard chain's behavior for future contributors_

## Phase 2 — Polling Infrastructure (Shared Across Features)

- [ ] 2.1 Implement usePageVisibility and pollingCadence constants
  - File: apps/frontend/src/hooks/usePageVisibility.ts, apps/frontend/src/utils/pollingCadence.ts
  - usePageVisibility(): returns current document visibility state and updates on `visibilitychange`
  - pollingCadence.ts: exports ACTIVE_JOB_INTERVAL_MS (a few seconds) and AMBIENT_INTERVAL_MS (materially slower), per architecture.md Section 8
  - Purpose: Provide the shared primitives every poll surface hook depends on (Requirement 12.2, 12.3, 12.4)
  - _Leverage: None — greenfield_
  - _Requirements: 12.2, 12.3, 12.4_
  - _Prompt: Role: React Developer specializing in browser visibility APIs and TanStack Query polling patterns | Task: Implement usePageVisibility.ts as a hook subscribing to the `visibilitychange` event and returning a boolean `isVisible`, and pollingCadence.ts exporting two named constants (ACTIVE_JOB_INTERVAL_MS set to a few seconds, e.g. 5000, and AMBIENT_INTERVAL_MS materially slower, e.g. 60000) matching architecture.md Section 8's cadence guidance | Restrictions: Do not couple usePageVisibility to any specific query library — it must be a plain, reusable hook, do not hardcode cadence values directly in feature/hook files — always import from pollingCadence.ts | Success: A test toggling `document.hidden` and dispatching `visibilitychange` shows the hook's returned value flips correctly; a test asserts ACTIVE_JOB_INTERVAL_MS < AMBIENT_INTERVAL_MS_

- [ ] 2.2 Implement the shared createPollingQueryOptions helper
  - File: apps/frontend/src/hooks/internal/pollingQueryOptions.ts
  - Implement a helper that, given a status-extraction function and a set of terminal statuses, returns TanStack Query options (`refetchInterval`, `refetchIntervalInBackground: false`) that stop polling at a terminal state and respect usePageVisibility
  - Purpose: Provide the one shared polling pattern reused by useSyncRunPolling, useMetricRunPolling, and useReportStatusPolling (Requirement 12.1, 12.2)
  - _Leverage: apps/frontend/src/hooks/usePageVisibility.ts, apps/frontend/src/utils/pollingCadence.ts_
  - _Requirements: 12.1, 12.2, 12.3_
  - _Prompt: Role: React Developer specializing in TanStack Query advanced configuration | Task: Implement pollingQueryOptions.ts exposing a function `createPollingQueryOptions<T>({ getStatus: (data: T) => string, terminalStatuses: string[], intervalMs: number })` returning a partial useQuery options object whose `refetchInterval` callback returns `false` once `getStatus(data)` is in `terminalStatuses`, and otherwise returns `intervalMs` only while the page is visible (via usePageVisibility), pausing (returning false or a very large interval) while hidden per Requirement 12.2 | Restrictions: This must be the only place refetchInterval-stopping logic is implemented — the three polling hooks in tasks 2.3-2.5 must not reimplement it, keep this framework-agnostic aside from TanStack Query's option shape | Success: A unit test using TanStack Query's test utilities shows refetchInterval returns false once mock data's status is terminal, and returns the configured interval while non-terminal and visible, and false/paused while hidden_

- [ ] 2.3 Implement useSyncRunPolling
  - File: apps/frontend/src/hooks/useSyncRunPolling.ts
  - useQuery over syncService.getSyncRun (or latest run for a repo), using createPollingQueryOptions with terminal statuses ['completed','failed'] and ACTIVE_JOB_INTERVAL_MS
  - Purpose: Poll surface #1 from architecture.md Section 8 ("Sync progress — sync run row — completed/failed"), backing Requirement 6.2, 7.3, 11.2
  - _Leverage: apps/frontend/src/services/syncService.ts, hooks/internal/pollingQueryOptions.ts, utils/pollingCadence.ts_
  - _Requirements: 6.2, 7.3, 11.2, 12.1, 12.2, 12.3_
  - _Prompt: Role: React Developer specializing in TanStack Query polling hooks | Task: Implement useSyncRunPolling(repoId, runId?) returning { run, status, isLoading, error }, calling syncService.getSyncRun when runId is given or the latest run for repoId otherwise, and using createPollingQueryOptions (task 2.2) with terminalStatuses ['completed','failed'] and ACTIVE_JOB_INTERVAL_MS so it satisfies Requirement 6.2 (Repository Landing cards update live) and Requirement 7.3 (Dashboard's Sync action polls until terminal) | Restrictions: Do not duplicate the terminal-state/visibility logic — delegate entirely to createPollingQueryOptions, do not poll when no sync is in flight (query should be disabled/idle if there's no active or requested run) | Success: A hook test (renderHook + QueryClientProvider) shows polling stops once mocked data's status becomes 'completed' or 'failed', and that requesting a specific runId targets the correct endpoint_

- [ ] 2.4 Implement useMetricRunPolling
  - File: apps/frontend/src/hooks/useMetricRunPolling.ts
  - useQuery over a metric_run status read (via a small addition to repositoriesService or a dedicated metricRunService, per architecture.md Section 4.4/Section 8), using createPollingQueryOptions with terminal statuses ['completed','failed'] and ACTIVE_JOB_INTERVAL_MS
  - Purpose: Poll surface #2 from architecture.md Section 8 ("Aggregation progress — metric_run — completed/failed"), backing Requirement 7.2/7.4 (dashboard reflecting aggregation progress) and Requirement 11.2 (global sync events)
  - _Leverage: apps/frontend/src/hooks/internal/pollingQueryOptions.ts, apps/frontend/src/types/metricRun.ts_
  - _Requirements: 7.2, 7.4, 11.2, 12.1, 12.2, 12.3_
  - _Prompt: Role: React Developer specializing in TanStack Query polling hooks | Task: Implement useMetricRunPolling(repoId) returning { metricRun, status, isLoading, error }, reading the latest metric_run for a repository (add a getLatestMetricRun function to repositoriesService.ts or a new metricRunService.ts if no Section 7 endpoint explicitly covers metric_run reads — check architecture.md Section 7's Products/Repositories row for the closest existing read path, such as GET /repositories/{id}/stats, and document which one you used), applying createPollingQueryOptions with terminalStatuses ['completed','failed'] and ACTIVE_JOB_INTERVAL_MS | Restrictions: Do not invent a new backend endpoint beyond what's implied by architecture.md Section 4.4/7 — if the exact metric_run read path is ambiguous, wrap the closest documented read (repository stats) and note the assumption in a code comment for the API team to confirm, do not duplicate polling logic | Success: A hook test shows polling stops at a terminal metric_run status; a code comment clearly flags the endpoint assumption for backend confirmation_

- [ ] 2.5 Implement useReportStatusPolling
  - File: apps/frontend/src/hooks/useReportStatusPolling.ts
  - useQuery over reportsService.getReportStatus(repoId, reportId), using createPollingQueryOptions with terminal statuses ['completed','failed'] and ACTIVE_JOB_INTERVAL_MS
  - Purpose: Poll surface #3 from architecture.md Section 8 ("Report generation — async_reports — completed/failed"), backing Requirement 8.3 and Requirement 9.5
  - _Leverage: apps/frontend/src/services/reportsService.ts, apps/frontend/src/hooks/internal/pollingQueryOptions.ts_
  - _Requirements: 8.3, 9.5, 11.2, 12.1, 12.2, 12.3_
  - _Prompt: Role: React Developer specializing in TanStack Query polling hooks | Task: Implement useReportStatusPolling(repoId, reportId) returning { report, status, stage, progress, isLoading, error }, calling reportsService.getReportStatus and applying createPollingQueryOptions with terminalStatuses ['completed','failed'] and ACTIVE_JOB_INTERVAL_MS, satisfying Requirement 8.3 (Reports tab card polling) and Requirement 9.5 (Report Viewer rendering progress view until completed) | Restrictions: Do not duplicate terminal/visibility logic, ensure the hook can be safely mounted from both ReportCard (grid context) and ReportViewerPage (detail context) without double-fetching thanks to TanStack Query's cache de-duplication (same query key for the same reportId) | Success: A hook test shows two simultaneously mounted consumers of the same reportId produce only one underlying network call (query de-duplication), and that polling stops at a terminal state_

- [ ] 2.6 Implement useGlobalSyncEvents
  - File: apps/frontend/src/hooks/useGlobalSyncEvents.ts
  - Aggregates active/recent sync runs, metric runs, and report jobs across the current Project's repositories into one list, exposing a count of non-terminal events for the Sync Events badge
  - Purpose: Back Requirement 11.1, 11.2, 11.3 (global Sync Events panel and badge)
  - _Leverage: apps/frontend/src/hooks/useSyncRunPolling.ts, useMetricRunPolling.ts, useReportStatusPolling.ts, contexts/RepositoryListContext.tsx_
  - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - _Prompt: Role: React Developer specializing in composing TanStack Query hooks | Task: Implement useGlobalSyncEvents() that, for every repository in RepositoryListContext, aggregates recent sync runs, metric runs, and report jobs into one normalized event list (each with type, repositoryId, status, relativeTime) and computes activeCount as the number of non-terminal events, satisfying Requirement 11.1 (panel content), 11.2 (live status per event via the existing polling hooks), and 11.3 (badge count) | Restrictions: Do not re-implement polling — compose the existing three polling hooks per repository rather than writing new fetch logic, keep the aggregation pure/derived so it has no side effects beyond the underlying hooks' own queries | Success: A hook test with a mocked RepositoryListContext of 2-3 repositories and mixed terminal/non-terminal mocked statuses produces the correct activeCount and event list_

## Phase 3 — App Shell: Topbar, Sidebar, Sync Events Panel

- [ ] 3.1 Implement Topbar, ProjectSwitcher, Breadcrumb
  - File: apps/frontend/src/features/appShell/Topbar.tsx, ProjectSwitcher.tsx, Breadcrumb.tsx
  - Renders the "Engineering Insights" wordmark, ProjectSwitcher (current Project name, dropdown of the account's Projects), Breadcrumb (derived from the current route), a Sync Events button with a badge, and an avatar/sign-out menu, matching app-shell.md's header row in both states
  - Purpose: Implement Requirement 2.1, 2.6, 2.7 and 1.5 (sign-out)
  - _Leverage: apps/frontend/src/contexts/CurrentProductContext.tsx, hooks/useGlobalSyncEvents.ts, app/RequireAuth.tsx (sign-out action), MUI AppBar/Toolbar/Menu_
  - _Requirements: 2.1, 2.6, 2.7, 1.5_
  - _Prompt: Role: Frontend Developer specializing in MUI AppBar layouts | Task: Implement Topbar.tsx composing the logo/wordmark, ProjectSwitcher.tsx (reads CurrentProductContext, opens a menu of the account's Projects via productsService.listProducts, and on selection calls setProductId then navigates to that Project's landing route per Requirement 2.6), Breadcrumb.tsx (derives Project / Repository / Tab segments from the current route match), a Sync Events icon button showing useGlobalSyncEvents().activeCount as a badge (Requirement 2.7), and an avatar menu with a sign-out action wired to the sign-out flow from task 1.10 (Requirement 1.5), all matching the header row structure in app-shell.md's both states | Restrictions: Do not implement the "create a new Project" flow — app-shell.md explicitly notes it is not wireframed, keep Breadcrumb purely derived from route state (no separate breadcrumb data-fetch) | Success: A render test confirms the topbar renders wordmark, switcher, breadcrumb text matching a mocked route, badge count matching a mocked useGlobalSyncEvents value, and that selecting a different Project in the switcher calls setProductId_

- [ ] 3.2 Implement OnboardingSidebar and ConnectedSidebar
  - File: apps/frontend/src/features/appShell/Sidebar.tsx, OnboardingSidebar.tsx, ConnectedSidebar.tsx
  - Sidebar.tsx: renders OnboardingSidebar or ConnectedSidebar based on useConnectorStatus
  - OnboardingSidebar: app-shell.md State 1 — only "Connector" enabled, "Settings"/"Repositories" shown locked
  - ConnectedSidebar: app-shell.md State 2 — "Connector", "Settings", and a "Repositories" accordion (expandable list of repository names + "Add Repository" action)
  - Purpose: Implement Requirement 2.2, 2.3, 2.4, 2.5
  - _Leverage: apps/frontend/src/hooks/useConnectorStatus.ts, contexts/RepositoryListContext.tsx, MUI Drawer/Accordion/List_
  - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - _Prompt: Role: Frontend Developer specializing in MUI Drawer/Accordion navigation patterns | Task: Implement Sidebar.tsx that switches between OnboardingSidebar.tsx (matching app-shell.md State 1: Connector enabled, Settings/Repositories rendered visually locked and not navigable — no NavLink/onClick wired) and ConnectedSidebar.tsx (matching State 2: Connector, Settings, and an expandable Repositories accordion listing every repository from RepositoryListContext by name with an "Add Repository" primary action) based on useConnectorStatus's connected boolean; clicking the "Repositories" accordion header navigates to Repository Landing (Requirement 2.4) without selecting a specific repo, and clicking a specific repository name navigates to that repository's Dashboard tab (Requirement 2.5) | Restrictions: Do not render Settings/Repositories as clickable/navigable in the locked state even if a user inspects the DOM — they must have no navigation handler attached, do not fetch repository list here — consume RepositoryListContext | Success: A render test shows OnboardingSidebar's Settings/Repositories have no click handlers and are visually distinct (disabled styling); a render test shows ConnectedSidebar's accordion lists mocked repository names and clicking one navigates (via a mocked router) to the expected path_

- [ ] 3.3 Implement SyncEventsPanel
  - File: apps/frontend/src/features/appShell/SyncEventsPanel.tsx
  - A panel/drawer opened from the Topbar's Sync Events button, listing events from useGlobalSyncEvents, each clickable to navigate to its most relevant screen
  - Purpose: Implement Requirement 11.1, 11.4
  - _Leverage: apps/frontend/src/hooks/useGlobalSyncEvents.ts_
  - _Requirements: 11.1, 11.4_
  - _Prompt: Role: Frontend Developer specializing in MUI Drawer/List panels | Task: Implement SyncEventsPanel.tsx as a panel (MUI Drawer or Popover, matching app-shell.md's "Sync events" affordance) rendering the list from useGlobalSyncEvents, each row showing type, repository scope, status (via StatusChip), and relative time, with a click handler that navigates to the Report Viewer/Reports tab for report events or the relevant repository's Dashboard for sync events, per Requirement 11.4 | Restrictions: Do not re-fetch event data independently — consume useGlobalSyncEvents only, keep navigation logic declarative (routePaths.ts helpers, not hardcoded strings) | Success: A render test with mocked events shows correct per-row content and that clicking a report-type event vs. a sync-type event navigates to the two different expected routes_

- [ ] 3.4 Compose AppShell and wire it into AppRouter
  - File: apps/frontend/src/features/appShell/AppShell.tsx
  - Composes Topbar + Sidebar + <Outlet/> as the layout for every authenticated route; wire into AppRouter (task 1.12) replacing its placeholder shell
  - Purpose: Complete Requirement 2.1's "every authenticated screen renders the topbar/sidebar" and finalize the routing skeleton from Phase 1 with real chrome
  - _Leverage: apps/frontend/src/features/appShell/Topbar.tsx, Sidebar.tsx, apps/frontend/src/app/AppRouter.tsx_
  - _Requirements: 2.1_
  - _Prompt: Role: Frontend Architect wiring layout composition into react-router-dom | Task: Implement AppShell.tsx rendering Topbar, Sidebar, and an <Outlet/> for the active route's page content, matching app-shell.md's overall row/col layout (240px sidebar column + flexible content column), then update AppRouter.tsx (task 1.12) to route every authenticated path through this AppShell layout | Restrictions: Do not put feature-specific content directly in AppShell — it is pure layout composition, preserve the RequireAuth/RequireConnector guard placement established in task 1.12 | Success: The integration test from task 1.13 still passes with AppShell now rendering real Topbar/Sidebar instead of a placeholder_

## Phase 4 — Feature: Project Connector (Onboarding & Ongoing)

- [ ] 4.1 Implement GitHubConnectorCard and JiraConnectorCard
  - File: apps/frontend/src/features/onboarding/GitHubConnectorCard.tsx, JiraConnectorCard.tsx
  - Each card renders both the onboarding action (Install GitHub App / Connect Jira) and the connected-state display (status, metadata, Test, Manage/Re-auth), switching based on useConnectorStatus per source
  - Purpose: Implement Requirement 3.1, 3.2, 3.3, 3.4, 3.5, matching project-connector.md
  - _Leverage: apps/frontend/src/hooks/useConnectorStatus.ts, services/connectorService.ts, components/StatusChip.tsx_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - _Prompt: Role: Frontend Developer specializing in OAuth-handoff UI flows | Task: Implement GitHubConnectorCard.tsx and JiraConnectorCard.tsx, each rendering the onboarding layout (primary action button + descriptive copy + OAuth/security note, matching project-connector.md/app-shell.md State 1) when disconnected, and the connected layout (status via StatusChip using live testConnector data, installation/account + token version + last-rotated for GitHub or cloud site + space key for Jira, a "Test" button re-invoking testConnector, and a "Manage"/"Re-auth" button) when connected; wire "Install GitHub App"/"Connect Jira" to initiate the respective OAuth redirect (integration-github / integration-jira apps) and, on return (e.g. via a query-param callback route or window focus refetch), invalidate the connector query so status updates without a manual refresh (Requirement 3.2/3.3) | Restrictions: Do not implement the GitHub App / Atlassian OAuth handshake internals — those are separate deployables (architecture.md Section 3); this task only initiates the redirect and reacts to the return, never store or display raw tokens (architecture.md Section 10) | Success: A render test shows the onboarding layout when mocked as disconnected and the connected layout with correct metadata fields when mocked as connected; a test shows clicking "Test" calls testConnector and updates the displayed status_

- [ ] 4.2 Implement ConnectorPage
  - File: apps/frontend/src/features/onboarding/ConnectorPage.tsx
  - Composes GitHubConnectorCard + JiraConnectorCard into the full Connector screen, in both onboarding and connected layouts, matching project-connector.md and app-shell.md State 1's data-sources panel
  - Purpose: Complete Requirement 3 end-to-end and wire the sidebar unlock (Requirement 3.7)
  - _Leverage: apps/frontend/src/features/onboarding/GitHubConnectorCard.tsx, JiraConnectorCard.tsx, hooks/useConnectorStatus.ts_
  - _Requirements: 3.1, 3.4, 3.7_
  - _Prompt: Role: Frontend Developer specializing in page-level composition | Task: Implement ConnectorPage.tsx composing the two connector cards under the "Data Sources" heading and descriptive copy from project-connector.md, and register it at the /connector route (task 1.12); verify that once both cards' underlying connector query transitions to connected, the sidebar (task 3.2, driven by the same useConnectorStatus hook/query cache) unlocks Settings/Repositories without a manual reload, satisfying Requirement 3.7 | Restrictions: Do not duplicate connector-fetching logic in this page — delegate entirely to the two cards' own hooks, reuse the same query key as Sidebar's useConnectorStatus so both derive from one cached value | Success: An integration test mounts ConnectorPage + Sidebar together, flips the mocked connector query from disconnected to connected, and asserts the Sidebar re-renders in its connected state without remounting the whole app_

## Phase 5 — Feature: Project Settings (Metadata, JIRA Configuration, Workflow Mapping)

- [ ] 5.1 Implement ProjectSettingsLayout and MetadataPanel
  - File: apps/frontend/src/features/projectSettings/ProjectSettingsLayout.tsx, MetadataPanel.tsx
  - ProjectSettingsLayout: sub-nav (Metadata, User Access [disabled], JIRA Workflow Mapping, JIRA Configuration), matching project-settings.md
  - MetadataPanel: editable Project name/Description form, read-only Jira space display, Save action
  - Purpose: Implement Requirement 4.1, 4.3-4.6
  - _Leverage: apps/frontend/src/contexts/CurrentProductContext.tsx, services/productsService.ts, components/ErrorState.tsx_
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_
  - _Prompt: Role: Frontend Developer specializing in MUI forms and settings layouts | Task: Implement ProjectSettingsLayout.tsx rendering the four-item sub-nav from project-settings.md with "User Access" visibly present but disabled/non-navigating (Requirement 4.6) and routed sub-panels for the other three; implement MetadataPanel.tsx with editable "Project name"/"Description" fields pre-populated from CurrentProductContext, a read-only Jira space display, client-side validation blocking an empty Project name without calling the API (Requirement 4.5), and a Save button calling productsService.updateCurrentProduct, showing success confirmation or a visible error while preserving the user's entered values on failure (Requirement 4.4) | Restrictions: Do not implement User Access functionality — it must remain visually present but inert per Requirement 4.6, do not allow Save to fire with an empty Project name | Success: A test shows Save with an empty name blocks submission and shows a validation error without a network call; a test shows a successful save reflects the confirmation and a failed save preserves the entered (unsaved) values with an error shown_

- [ ] 5.2 Implement JiraConfigurationPanel
  - File: apps/frontend/src/features/projectSettings/JiraConfigurationPanel.tsx
  - Read-only summary of the Project's Jira connection (cloud site, space key, live connector status) with a link to the Connector screen
  - Purpose: Implement Requirement 4.2
  - _Leverage: apps/frontend/src/hooks/useConnectorStatus.ts, services/connectorService.ts, app/routePaths.ts_
  - _Requirements: 4.2_
  - _Prompt: Role: Frontend Developer specializing in read-only summary views | Task: Implement JiraConfigurationPanel.tsx rendering the Jira connection's cloud site, space key, and live connected/disconnected status (reusing the same connector-test data source as the Connector screen), plus a link navigating to /connector, per Requirement 4.2's explicit scope (no editing controls beyond this summary) | Restrictions: Do not add any editing/re-scoping controls — project-settings.md defines no further behavior here and Requirement 4.2 explicitly scopes this out | Success: A render test confirms cloud site/space key/status render from mocked data and the link navigates to the Connector route_

- [ ] 5.3 Implement WorkflowMappingPanel and WorkflowMappingRow
  - File: apps/frontend/src/features/projectSettings/workflowMapping/WorkflowMappingPanel.tsx, WorkflowMappingRow.tsx
  - Table of Jira status → canonical phase mappings with a mapped/unmapped badge, per-row phase selector, "Infer unmapped" (LLM suggestions requiring confirmation), and "Save"
  - Purpose: Implement Requirement 5.1-5.6, matching project-settings-workflow.md
  - _Leverage: apps/frontend/src/services/workflowMappingService.ts, components/StatusChip.tsx_
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - _Prompt: Role: Frontend Developer specializing in editable data tables with MUI | Task: Implement WorkflowMappingPanel.tsx fetching every Jira status via workflowMappingService.getMappings/getStatuses and rendering a table (Jira status | canonical phase selector | state) with a "N mapped · M unmapped" badge (Requirement 5.2), the six canonical phase chips row from project-settings-workflow.md, local (unsaved) staging of phase selections per Requirement 5.3, an "Infer unmapped" button calling workflowMappingService.inferMappings and rendering each suggestion as an "inferred: {phase}?" chip requiring explicit confirmation before being treated as mapped (Requirement 5.4), and a "Save" button submitting all staged mappings via putMappings, leaving unselected statuses unmapped rather than defaulting them and not blocking the save of already-mapped statuses (Requirement 5.6), showing success/error feedback while retaining staged edits on failure (Requirement 5.5); implement WorkflowMappingRow.tsx as the single-row component reused by the table | Restrictions: Do not call the mapping-save endpoint on every individual phase selection — changes are staged locally until "Save" is clicked, do not auto-confirm inferred suggestions | Success: A test stages several phase selections, clicks Infer, confirms one inferred suggestion, clicks Save, and asserts putMappings was called with exactly the staged+confirmed set, leaving any untouched status unmapped_

## Phase 6 — Feature: Repository Landing

- [ ] 6.1 Implement RepositoryCard and RepositorySearchField
  - File: apps/frontend/src/features/repositoryLanding/RepositoryCard.tsx, RepositorySearchField.tsx
  - RepositoryCard: identity, sync-health status, last-synced/in-progress state (via useSyncRunPolling), hero metric slot; RepositorySearchField: debounced search input
  - Purpose: Implement Requirement 6.1, 6.2, 6.3, matching repository-landing.md
  - _Leverage: apps/frontend/src/hooks/useSyncRunPolling.ts, hooks/useDebouncedValue.ts, components/StatusChip.tsx, MetricCard.tsx_
  - _Requirements: 6.1, 6.2, 6.3_
  - _Prompt: Role: Frontend Developer specializing in card-grid UI with live status | Task: Implement RepositoryCard.tsx rendering repository name, `owner/repo` identity, a StatusChip-based sync-health indicator, and either a last-synced relative time or (when useSyncRunPolling reports a non-terminal status) a spinner + "First sync in progress" copy that automatically updates to the last-synced display once the poll reaches a terminal state (Requirement 6.2), plus a hero MetricCard slot; implement RepositorySearchField.tsx as a debounced (via a new hooks/useDebouncedValue.ts) search input filtering the parent's repository list by name or identity as the user types (Requirement 6.3) | Restrictions: Do not fetch the repository list itself in RepositoryCard — it receives one repository via props and only owns its own sync-status poll, do not perform the actual filtering inside RepositorySearchField — it should emit the debounced query value for the parent page to filter with | Success: A test shows the card renders the spinner/in-progress copy for a mocked non-terminal sync status and switches to last-synced copy once the mock flips to 'completed'; a test shows typing in the search field emits a debounced value_

- [ ] 6.2 Implement AddRepositoryDialog
  - File: apps/frontend/src/features/repositoryLanding/AddRepositoryDialog.tsx
  - Form collecting key, display_name, github_owner, github_repo, jira_project_key, ticket_key_pattern; required-field validation; submits via repositoriesService.createRepository; surfaces 409 as a field-level duplicate-key error
  - Purpose: Implement Requirement 6.4, 6.5, 6.6
  - _Leverage: apps/frontend/src/services/repositoriesService.ts_
  - _Requirements: 6.4, 6.5, 6.6_
  - _Prompt: Role: Frontend Developer specializing in MUI form dialogs with validation | Task: Implement AddRepositoryDialog.tsx as an MUI Dialog with a form collecting exactly the fields named in Requirement 6.4 (key, display_name, github_owner, github_repo, jira_project_key, ticket_key_pattern), blocking submission with a validation error when any required field is blank without calling the API (Requirement 6.6), submitting via repositoriesService.createRepository on confirm, and — when the resulting ApiError has status 409 — surfacing it as a field-level error on the `key` field (Requirement 6.5) rather than a generic toast, and not adding a duplicate card | Restrictions: Do not silently swallow the 409 as a generic error — it must be attributed to the `key` field specifically since that's the conflicting column, do not close the dialog on a validation or 409 failure | Success: A test submits with a blank required field and asserts no network call plus a visible validation error; a test mocks createRepository rejecting with a 409 ApiError and asserts the key field shows the duplicate error and the dialog stays open_

- [ ] 6.3 Implement RepositoryLandingPage (including zero-repository empty state)
  - File: apps/frontend/src/features/repositoryLanding/RepositoryLandingPage.tsx
  - Composes RepositoryCard grid + RepositorySearchField + AddRepositoryDialog + a dedicated "Add repository" card; renders only the "Add repository" card when the Project has zero repositories
  - Purpose: Complete Requirement 6 end-to-end, including 6.7 (empty state) and 6.8 (navigate to workspace on card click)
  - _Leverage: apps/frontend/src/contexts/RepositoryListContext.tsx, features/repositoryLanding/RepositoryCard.tsx, RepositorySearchField.tsx, AddRepositoryDialog.tsx, components/EmptyState.tsx_
  - _Requirements: 6.1, 6.7, 6.8_
  - _Prompt: Role: Frontend Developer specializing in page-level composition with MUI Grid | Task: Implement RepositoryLandingPage.tsx composing the header ("Project / Repositories" + search + "Add Repository" button), a grid of RepositoryCard components sourced from RepositoryListContext and filtered by RepositorySearchField's debounced query, a dedicated "Add repository" card that opens AddRepositoryDialog, and — when RepositoryListContext's repositories list is empty — render only the "Add repository" card with inviting empty-state copy (Requirement 6.7) instead of an empty grid; clicking any RepositoryCard navigates to that repository's workspace Dashboard tab (Requirement 6.8) via routePaths.ts | Restrictions: Do not fetch repositories directly — consume RepositoryListContext, do not render both a "no repositories" message and stale/leftover card placeholders simultaneously | Success: A test with a mocked empty RepositoryListContext renders only the Add-repository card and matching empty-state copy; a test with 3 mocked repositories and a search query filters the grid correctly and clicking a card navigates to the expected path_

## Phase 7 — Feature: Repository Workspace Shell (Header + Tabs)

- [ ] 7.1 Implement RepositoryHeader and RepositoryWorkspaceLayout
  - File: apps/frontend/src/features/repositoryWorkspace/RepositoryHeader.tsx, RepositoryWorkspaceLayout.tsx
  - RepositoryHeader: identity, live sync status (useSyncRunPolling), last-synced time, "Sync" action (triggers syncService.triggerSync, disables while in flight)
  - RepositoryWorkspaceLayout: renders RepositoryHeader + the three-tab MUI Tabs (Dashboard/Reports/Settings) + <Outlet/>
  - Purpose: Implement Requirement 7.1, 7.3, shared by Dashboard/Reports/Settings tabs
  - _Leverage: apps/frontend/src/hooks/useSyncRunPolling.ts, services/syncService.ts, services/repositoriesService.ts_
  - _Requirements: 7.1, 7.3_
  - _Prompt: Role: Frontend Developer specializing in MUI Tabs and shared workspace layouts | Task: Implement RepositoryHeader.tsx rendering the repository's name, `owner/repo`, a StatusChip-based sync status driven by useSyncRunPolling, last-synced relative time, and a "Sync" button that calls syncService.triggerSync, disables itself while a run is in flight, and relies on useSyncRunPolling to update the displayed status/time live until the run reaches a terminal state (Requirement 7.3); implement RepositoryWorkspaceLayout.tsx composing RepositoryHeader plus an MUI Tabs bar (Dashboard/Reports/Settings, matching repository-dashboard.md/repository-reports.md/repository-settings.md) and an <Outlet/> for the active tab's content, registering nested routes for /repositories/:repoId/dashboard, /reports, /settings in AppRouter (task 1.12) | Restrictions: Do not duplicate sync-status polling logic — reuse useSyncRunPolling exactly as built in task 2.3, do not hardcode tab paths — use routePaths.ts | Success: A test shows clicking "Sync" calls triggerSync and disables the button, then re-enables and updates last-synced text once the mocked poll reports a terminal state; a test shows each of the three tabs routes to the correct nested Outlet content_

## Phase 8 — Feature: Repository Dashboard Tab

- [ ] 8.1 Implement MetricStrip, PrimaryViewPanel, SignalsPanel
  - File: apps/frontend/src/features/repositoryWorkspace/dashboard/MetricStrip.tsx, PrimaryViewPanel.tsx, SignalsPanel.tsx
  - MetricStrip: hero metric cards from repositoriesService.getRepositoryStats; PrimaryViewPanel: visualization placeholder panel; SignalsPanel: **placeholder-only in this phase** per design.md's data-source caveat (architecture.md Section 7 exposes `signal_config` rule definitions, not fired-signal instances outside a specific report — there is no endpoint for "currently fired signals" at the repository/dashboard level)
  - Purpose: Implement Requirement 7.2, 7.4, 7.5
  - _Leverage: apps/frontend/src/hooks/useRepositoryStats.ts (new, wraps repositoriesService.getRepositoryStats), components/MetricCard.tsx, SectionErrorBoundary.tsx, EmptyState.tsx_
  - _Requirements: 7.2, 7.4, 7.5_
  - _Prompt: Role: Frontend Developer specializing in dashboard panels with independent data sources | Task: First implement hooks/useRepositoryStats.ts (a useQuery wrapping repositoriesService.getRepositoryStats at the AMBIENT_INTERVAL_MS cadence from pollingCadence.ts, since this is ambient dashboard data per Requirement 12.4, not an active-job poll); then implement MetricStrip.tsx (renders a row of MetricCard components from the stats data, or an empty/placeholder state per Requirement 7.4 when no facts exist yet) and PrimaryViewPanel.tsx (a visualization placeholder panel matching repository-dashboard.md's "Primary View" section); implement SignalsPanel.tsx as a **static placeholder panel with no data-fetching** in this phase, per design.md's explicit caveat that architecture.md Section 7 has no endpoint for fired signals outside a specific report (do NOT wire it to signalsService.getSignals, which reads signal_config rule definitions, not fired signals — wiring it there would render the wrong data); each of the three panels must still be wrapped in its own SectionErrorBoundary for forward-compatibility once a real fired-signals endpoint exists (Requirement 7.5) | Restrictions: Do not use the active-job polling cadence for repository stats — this is ambient data per Requirement 12.4, do not wire SignalsPanel to signalsService (signal_config) — that would silently misrepresent configuration data as live signals | Success: A test shows MetricStrip renders an empty/placeholder state (not an error) when stats data indicates no facts yet; a test shows SignalsPanel renders its static placeholder content with zero network calls_

- [ ] 8.2 Implement DashboardPage
  - File: apps/frontend/src/features/repositoryWorkspace/dashboard/DashboardPage.tsx
  - Composes MetricStrip + PrimaryViewPanel + SignalsPanel + the "Secondary" placeholder panel, matching repository-dashboard.md
  - Purpose: Complete Requirement 7 end-to-end (including the Secondary panel per Requirement 7.2)
  - _Leverage: apps/frontend/src/features/repositoryWorkspace/dashboard/MetricStrip.tsx, PrimaryViewPanel.tsx, SignalsPanel.tsx, components/EmptyState.tsx_
  - _Requirements: 7.2_
  - _Prompt: Role: Frontend Developer specializing in dashboard page composition | Task: Implement DashboardPage.tsx laying out MetricStrip across the top, PrimaryViewPanel and SignalsPanel side-by-side, and a "Secondary" placeholder panel (a static EmptyState-based card with no data-fetching, per Requirement 7.2's explicit scoping) beneath Signals, matching repository-dashboard.md's two-column composition, and register it at /repositories/:repoId/dashboard | Restrictions: The Secondary panel must not fetch any data in this phase — it is a static placeholder only, do not reorder the layout relative to repository-dashboard.md | Success: A render test confirms all four regions (MetricStrip, PrimaryView, Signals, Secondary) are present and the Secondary panel makes no network calls_

## Phase 9 — Feature: Repository Reports Tab

- [ ] 9.1 Implement ReportCard
  - File: apps/frontend/src/features/repositoryWorkspace/reports/ReportCard.tsx
  - Renders a report's type/period/status; completed → completion time, signal count, Open + gear (delete) actions; in-progress → spinner/progress/stage via useReportStatusPolling; failed → retry count, View error, Retry
  - Purpose: Implement Requirement 8.1, 8.2, 8.3, 8.4
  - _Leverage: apps/frontend/src/hooks/useReportStatusPolling.ts, services/reportsService.ts, components/StatusChip.tsx_
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - _Prompt: Role: Frontend Developer specializing in status-driven card components | Task: Implement ReportCard.tsx accepting one report summary as a prop and using useReportStatusPolling(repoId, reportId) to drive its live display: for status 'completed', show completion time + signal count + an "Open" action navigating to the Report Viewer (Requirement 8.2's Open action) + a gear icon opening a small menu with a "Delete" action calling reportsService.deleteReport and removing the card from the parent grid on success (Requirement 8.2's gear action); for a non-terminal status, show a spinner, a progress indicator, and the current stage, updating live as the poll ticks (Requirement 8.3); for 'failed', show retry count, a "View error" action revealing the error message, and a "Retry" action re-invoking reportsService.createReport for the same type/period (Requirement 8.4) | Restrictions: Do not poll from the parent grid as well — each ReportCard owns its own polling via useReportStatusPolling (relying on TanStack Query's cache de-dup if the same reportId is also open in the Report Viewer), do not permanently remove a card from the UI without confirming the delete API call succeeded | Success: A test renders the card in each of the three states (completed/generating/failed) and asserts the state-specific controls/copy are present; a test confirms clicking gear→Delete calls deleteReport and the card signals removal to its parent on success_

- [ ] 9.2 Implement GenerateReportDialog and ReportFilterMenu
  - File: apps/frontend/src/features/repositoryWorkspace/reports/GenerateReportDialog.tsx, ReportFilterMenu.tsx
  - GenerateReportDialog: pick report type + period, submit via reportsService.createReport, surface 409 conflict as a clear message; ReportFilterMenu: client-side filter controls (status, report type) applied to already-fetched data
  - Purpose: Implement Requirement 8.5, 8.6
  - _Leverage: apps/frontend/src/services/reportsService.ts_
  - _Requirements: 8.5, 8.6_
  - _Prompt: Role: Frontend Developer specializing in MUI dialogs and client-side filtering | Task: Implement GenerateReportDialog.tsx with controls to pick a report type and period, calling reportsService.createReport on confirm, and when the resulting ApiError is a 409 (duplicate product/repo/report_type/period per architecture.md Section 4.5's UNIQUE constraint), surfacing a clear "a report for this period already exists" message rather than creating a duplicate card (Requirement 8.5); implement ReportFilterMenu.tsx exposing status/report-type filter controls whose selection is applied by the parent ReportsPage to the already-fetched report list without an additional network request (Requirement 8.6) | Restrictions: Do not send a new list request when a filter changes if the data is already client-side available — filtering must be a pure function over already-fetched data, do not silently retry report creation on 409 — always show the message | Success: A test mocks createReport rejecting with 409 and asserts the dialog shows the conflict message without adding a card; a test shows selecting a filter option changes the rendered subset of a fixed, already-fetched report list with zero additional mocked network calls_

- [ ] 9.3 Implement ReportsPage
  - File: apps/frontend/src/features/repositoryWorkspace/reports/ReportsPage.tsx
  - Composes useReports (list) + ReportCard grid + GenerateReportDialog + ReportFilterMenu, matching repository-reports.md
  - Purpose: Complete Requirement 8 end-to-end
  - _Leverage: apps/frontend/src/hooks/useReports.ts (new, wraps reportsService.listReports), features/repositoryWorkspace/reports/ReportCard.tsx, GenerateReportDialog.tsx, ReportFilterMenu.tsx_
  - _Requirements: 8.1_
  - _Prompt: Role: Frontend Developer specializing in page-level composition | Task: First implement hooks/useReports.ts as a useQuery wrapping reportsService.listReports for a repository; then implement ReportsPage.tsx rendering the "Reports" header + Filter/Generate report toolbar + a grid of ReportCard components sourced from useReports and filtered by ReportFilterMenu's selection, plus the dedicated "Generate a report" card that opens GenerateReportDialog, matching repository-reports.md, and register it at /repositories/:repoId/reports | Restrictions: Do not fetch per-card status data at the page level — each ReportCard owns its own useReportStatusPolling, do not duplicate the list-fetch logic outside useReports | Success: A test with a mocked mixed-status report list renders one ReportCard per report plus the Generate card, and the toolbar's Generate action opens the dialog_

## Phase 10 — Feature: Report Viewer

- [ ] 10.1 Implement ReportKpiStrip, SignalCard, ReportGenerationProgress
  - File: apps/frontend/src/features/reportViewer/ReportKpiStrip.tsx, SignalCard.tsx, ReportGenerationProgress.tsx
  - ReportKpiStrip: KPI cards with "vs prev period" comparisons from reportsService.getReportData; SignalCard: severity chip, narrative, Evidence panel from report_signal.evidence; ReportGenerationProgress: renders while status != completed, using useReportStatusPolling
  - Purpose: Implement Requirement 9.1, 9.2, 9.5
  - _Leverage: apps/frontend/src/services/reportsService.ts, hooks/useReportStatusPolling.ts, components/MetricCard.tsx, StatusChip.tsx_
  - _Requirements: 9.1, 9.2, 9.5_
  - _Prompt: Role: Frontend Developer specializing in editorial-brief style UI | Task: Implement ReportKpiStrip.tsx rendering a row of KPI MetricCard-based cards with "vs prev period" comparison text from reportsService.getReportData (Requirement 9.1); implement SignalCard.tsx rendering one fired report_signal's severity chip (High/Medium/Low, styled via StatusChip's severity variant), narrative text, and an "Evidence" panel rendering the frozen report_signal.evidence payload as-is (opaque fact ids/values, not recomputed, per Requirement 9.2); implement ReportGenerationProgress.tsx rendering a progress view (spinner, stage, progress bar) driven by useReportStatusPolling, used when a report's status is not yet 'completed' (Requirement 9.5) | Restrictions: SignalCard must render evidence exactly as received (no client-side recomputation or reinterpretation of the frozen values), ReportGenerationProgress must reuse useReportStatusPolling rather than a new fetch | Success: A test renders SignalCard with mocked evidence and asserts it displays the payload's fact ids/values verbatim; a test renders ReportGenerationProgress with a mocked non-terminal status and shows it switches to a "completed" signal once the mock updates_

- [ ] 10.2 Implement ReportViewerPage (including prev/next navigation, regenerate, error state)
  - File: apps/frontend/src/features/reportViewer/ReportViewerPage.tsx
  - Composes header (title/status/period/generated-time), ReportKpiStrip, "This period's signals" section of SignalCards, Prev/Next navigation between adjacent reports of the same type, Regenerate action, and ReportGenerationProgress fallback for non-completed reports, matching report-viewer.md
  - Purpose: Complete Requirement 9 end-to-end (9.1-9.6)
  - _Leverage: apps/frontend/src/features/reportViewer/ReportKpiStrip.tsx, SignalCard.tsx, ReportGenerationProgress.tsx, services/reportsService.ts, components/ErrorState.tsx_
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  - _Prompt: Role: Frontend Developer specializing in detail-page composition with adjacent-record navigation | Task: Implement ReportViewerPage.tsx: fetch the report and its data via reportsService.getReport/getReportData; if status is not 'completed', render ReportGenerationProgress instead of the brief layout, automatically switching to the full brief once polling reports 'completed' (Requirement 9.5); when completed, render the header (title, StatusChip, period label, generated-time), the breadcrumb ending in the report's period (coordinate with Breadcrumb from task 3.1), ReportKpiStrip, and a "This period's signals" section mapping each report_signal to a SignalCard (Requirement 9.1/9.2); implement "‹ Prev"/"Next ›" buttons that fetch/navigate to the chronologically adjacent report of the same report type for the same repository (via reportsService.listReports filtered client-side or a dedicated adjacent-report lookup), disabling/hiding the control at either boundary (Requirement 9.3); implement "Regenerate" calling reportsService.createReport for the same type/period and navigating to/updating the resulting job's progress view per Requirement 8.3 semantics (Requirement 9.4); on a 404 (e.g. deleted report), render a full-page ErrorState with a control navigating back to the Reports tab (Requirement 9.6) | Restrictions: Do not recompute or reshape signal evidence — pass it through to SignalCard unchanged, do not hide the Prev/Next controls entirely when navigation is merely loading — only hide/disable at a genuine boundary (no adjacent report exists) | Success: A test opens a report mocked as 'generating' and shows ReportGenerationProgress, then asserts the brief layout renders once the mock flips to 'completed'; a test at the earliest report of its type shows "‹ Prev" disabled/hidden; a test mocks a 404 and asserts ErrorState with working back-navigation_

## Phase 11 — Feature: Repository Settings (Clusters & Connector Override)

- [ ] 11.1 Implement ClusterTable, ClusterFormDialog, ImportClustersDialog
  - File: apps/frontend/src/features/repositoryWorkspace/settings/clusters/ClusterTable.tsx, ClusterFormDialog.tsx, ImportClustersDialog.tsx
  - ClusterTable: name/pattern/curation-status-chip/file-count table with active-count badge; ClusterFormDialog: add/edit cluster; ImportClustersDialog: JSON payload import
  - Purpose: Implement Requirement 10.2, 10.3, 10.4, 10.6
  - _Leverage: apps/frontend/src/services/clustersService.ts, components/StatusChip.tsx_
  - _Requirements: 10.2, 10.3, 10.4, 10.6_
  - _Prompt: Role: Frontend Developer specializing in editable MUI data tables | Task: Implement ClusterTable.tsx rendering clusters from clustersService.listClusters (name, file pattern, a curation-status chip distinctly styled per auto/confirmed/renamed/manual/archived, file count) with a "N active" badge (Requirement 10.2); implement ClusterFormDialog.tsx usable for both create (clustersService.createCluster, Requirement 10.3) and edit (clustersService.updateCluster, Requirement 10.4) of a cluster's name/pattern, updating the table on success or showing an error on failure without a full reload; implement ImportClustersDialog.tsx accepting a JSON payload and submitting via clustersService.importClusters, showing success or a validation/error message on failure (Requirement 10.6) | Restrictions: Do not allow editing the curation_status directly through this UI (it's derived server-side by recompute/curation actions, not a free-text field), do not lose already-entered form values on a validation failure | Success: A test adds a cluster via the dialog and asserts it appears in the table without a page reload; a test edits an existing cluster's pattern and asserts the table reflects the update; a test submits invalid JSON to ImportClustersDialog and asserts a visible validation error_

- [ ] 11.2 Implement ClustersPanel (Recompute action) and RepositorySettingsLayout
  - File: apps/frontend/src/features/repositoryWorkspace/settings/clusters/ClustersPanel.tsx, apps/frontend/src/features/repositoryWorkspace/settings/RepositorySettingsLayout.tsx
  - ClustersPanel: composes ClusterTable + ClusterFormDialog + ImportClustersDialog + Recompute action with a curation-preservation confirmation message; RepositorySettingsLayout: sub-nav for Clusters (default) and Connector override
  - Purpose: Implement Requirement 10.1, 10.5
  - _Leverage: apps/frontend/src/features/repositoryWorkspace/settings/clusters/ClusterTable.tsx, ClusterFormDialog.tsx, ImportClustersDialog.tsx, services/clustersService.ts_
  - _Requirements: 10.1, 10.5_
  - _Prompt: Role: Frontend Developer specializing in settings-panel composition | Task: Implement ClustersPanel.tsx composing the header ("Code Areas / Clusters" + Import JSON/Recompute/Add Cluster toolbar, matching repository-settings.md), ClusterTable, and the two dialogs from task 11.1; wire "Recompute" to clustersService.recomputeClusters and, on success, display a confirmation panel/message stating that human-curated clusters (confirmed/renamed/manual) are never overwritten by recompute (Requirement 10.5, citing architecture.md Section 4.2); implement RepositorySettingsLayout.tsx rendering the "REPO SETTINGS" sub-nav (Clusters default active, Connector override) and register nested routes /repositories/:repoId/settings/clusters and /connector-override in AppRouter | Restrictions: Do not phrase the recompute confirmation in a way that implies all clusters are recomputed uniformly — it must explicitly state curated statuses are preserved, do not merge Clusters and Connector override into one screen — they remain separate sub-nav panels per repository-settings.md | Success: A test clicks Recompute and asserts the curation-preservation message renders after a successful mocked response; a test confirms the sub-nav defaults to Clusters and switching to Connector override renders task 11.3's panel_

- [ ] 11.3 Implement ConnectorOverridePanel
  - File: apps/frontend/src/features/repositoryWorkspace/settings/connectorOverride/ConnectorOverridePanel.tsx
  - Repository-scoped connector management reusing GitHubConnectorCard/JiraConnectorCard, indicating override-vs-fallback state
  - Purpose: Implement Requirement 10.7
  - _Leverage: apps/frontend/src/features/onboarding/GitHubConnectorCard.tsx, JiraConnectorCard.tsx, services/connectorService.ts_
  - _Requirements: 10.7_
  - _Prompt: Role: Frontend Developer specializing in scoped configuration reuse | Task: Implement ConnectorOverridePanel.tsx rendering GitHubConnectorCard/JiraConnectorCard (from task 4.1) configured with repository scope (GET/PUT/POST(test)/DELETE /repositories/{id}/connector) instead of product scope, and an indicator stating whether the repository currently has its own override configured or is falling back to the Project-level connector (Requirement 10.7) | Restrictions: Do not fork GitHubConnectorCard/JiraConnectorCard into repo-specific copies — parameterize their existing scope prop instead, do not implement the repository→product fallback resolution logic client-side — only display which case currently applies, as reported by the repository-scoped connector read | Success: A test mocks a repository with no override configured and asserts the panel indicates fallback-to-Project; a test mocks a repository-level override present and asserts the panel indicates the override is active, with the two connector cards operating against the repository-scoped endpoints_

## Phase 12 — Cross-Cutting Hardening & Final Integration

- [ ] 12.1 Add per-screen loading skeletons and error boundaries where not already covered
  - File: apps/frontend/src/features/**/*.tsx (audit pass across ConnectorPage, ProjectSettingsLayout panels, RepositoryLandingPage, DashboardPage, ReportsPage, ReportViewerPage, RepositorySettingsLayout panels)
  - Wrap each page-level component's primary data region in LoadingSkeleton (first fetch) and confirm SectionErrorBoundary usage is consistent across all independently-fetched panels
  - Purpose: Close out Requirement 13.1 and the Reliability NFR across every screen, not just the ones built with it inline
  - _Leverage: apps/frontend/src/components/LoadingSkeleton.tsx, SectionErrorBoundary.tsx, ErrorState.tsx_
  - _Requirements: 13.1, NFR Reliability_
  - _Prompt: Role: Frontend Developer performing a cross-cutting consistency audit | Task: Review every feature page implemented in Phases 4-11 and ensure each one shows LoadingSkeleton during its primary data's first fetch (Requirement 13.1) and that every independently-fetched panel within a page (as distinct from the page's single primary query) is wrapped in SectionErrorBoundary consistent with the pattern established in task 8.1's Dashboard panels | Restrictions: Do not introduce new data-fetching behavior in this task — it is a consistency/wiring pass only, do not wrap single-query pages in more error boundaries than they have independent data sources | Success: A checklist comment or short test per audited page confirms a loading state renders before data resolves and that a simulated fetch failure in one panel does not blank the rest of a multi-panel page_

- [ ] 12.2 Add retry semantics for failed mutations across forms
  - File: apps/frontend/src/features/**/*.tsx (MetadataPanel, WorkflowMappingPanel, AddRepositoryDialog, ClusterFormDialog, ImportClustersDialog, GenerateReportDialog)
  - Confirm every mutating form clears its prior error state and re-attempts on a subsequent user-initiated retry (re-click Save / retry control) per Requirement 13.4
  - Purpose: Close out Requirement 13.4 across every mutation surface built in Phases 5, 6, 9, 11
  - _Leverage: TanStack Query's useMutation reset/retry semantics_
  - _Requirements: 13.4_
  - _Prompt: Role: Frontend Developer performing a cross-cutting consistency audit | Task: Review every mutating form/dialog built in Phases 5, 6, 9, and 11 and confirm that clicking the same submit/retry control after a failure clears the previously displayed error and re-attempts the same mutation (Requirement 13.4), adjusting any form whose error state does not clear on a fresh attempt | Restrictions: Do not change the success-path behavior of any of these forms, do not add a generic retry wrapper that bypasses each form's specific validation | Success: A test per audited form (or a shared parametrized test) shows: mutation fails → error shown → same action re-invoked → error clears and the mutation call is attempted again_

- [ ] 12.3 Full-app integration test: onboarding-to-report-viewer happy path
  - File: apps/frontend/src/app/fullFlow.integration.test.tsx
  - Simulate: login → connector onboarding → sidebar unlock → add repository → dashboard → generate report → report completes via polling → open report viewer → navigate back
  - Purpose: Prove the entire feature set composes correctly end-to-end at the component-tree level, the final gate before considering the SPA implementation-complete
  - _Leverage: All services/hooks/features from Phases 1-11, mocked at the service layer_
  - _Requirements: All_
  - _Prompt: Role: QA Engineer specializing in full-flow React Testing Library integration tests | Task: Write fullFlow.integration.test.tsx that mocks the service layer (not apiClient's internals) to simulate a full happy path: authenticated session established → Project has no connector, ConnectorPage renders onboarding layout → mocked connector transitions to connected → Sidebar unlocks, user adds a Repository via AddRepositoryDialog → navigates to its Dashboard → opens Reports tab and generates a report → mocked useReportStatusPolling ticks from 'generating' to 'completed' → user opens the Report Viewer and sees KPIs/signals → user navigates back to the Reports tab | Restrictions: Mock at the services/*.ts boundary (not fetch/apiClient) so the test exercises real hooks/features/contexts, do not assert on visual styling — assert on rendered text/roles/navigation outcomes | Success: The full simulated flow passes in one coherent test (or a small suite of sequential tests sharing one rendered app instance), demonstrating every phase's pieces integrate correctly_
