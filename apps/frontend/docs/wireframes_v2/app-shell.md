# App Shell — Topbar + Sidebar States

Wireloom reference for the global chrome every screen inherits. Defines the topbar and the two
sidebar states (onboarding-pending vs connected). Individual screens render their own workspace
card inside this shell.

Terminology: the tenant is a **Project** (1-1 with its JIRA space); a Project owns **Repositories**.
The topbar switcher switches between Projects — the field is shown for context; the create-new-Project
flow is intentionally not wireframed.

## State 1 — Onboarding (connection pending)

Sidebar focus is the Connector; Settings and Repositories are locked until a source links. The
old standalone "connect a source" page is absorbed here as the Connector section's content.

```wireloom
window "Engineering Insights — Onboarding":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold        # logo + wordmark
        button "Acme Engineering ▾"                # Project switcher (tenant = JIRA space)
      text "Acme Engineering / Connect a source" muted    # breadcrumb (wayfinding)
      row:
        button "Sync events"                        # global; inert until first sync
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" bold accent=research      # active onboarding focus
        text "Settings — locked" muted
        text "Repositories — locked" muted
        divider
        text "Locked until a source is connected" muted size=small italic
        divider
        text "Support" muted

    col:
      panel:
        text "Data Sources" muted size=small
        text "Connect GitHub and Jira" bold size=large
        text "Authorize the tools we correlate. Tokens are stored encrypted at the Project level; you can override per repository later." muted
      row:
        slot "GitHub App" accent=research:
          text "PRs, reviews, file diffs" muted size=small
          button "Install GitHub App" primary
        slot "Jira Software" accent=research:
          text "Issues, transitions, assignments" muted size=small
          button "Connect Jira" primary
      row:
        icon name="authority"
        text "OAuth 2.0 / scoped tokens only. No raw credentials stored; tokens never returned to the frontend." muted size=small
```

## State 2 — Connected (normal operations)

Settings and Repositories unlock. Repositories is an accordion; clicking its title opens the
Repository Landing card. Contextual actions stay inside the workspace card (Sync, tabs, toolbars).

```wireloom
window "Engineering Insights — core-api":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"                # Project switcher
      text "Acme Engineering / core-api / Reports" muted    # breadcrumb: Project / Repository / tab
      row:
        button "Sync events (2)"                    # global sync/job event list (§8)
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" muted                     # Project-level data-source connection
        text "Settings" muted                      # Project-level settings (metadata, access, JIRA)
        divider
        text "Repositories" bold                   # accordion header → Repository Landing
        text "  core-api" bold accent=research      # active view
        text "  web-client" muted
        text "  data-pipeline" muted
        button "Add Repository" primary icon="plus"
        divider
        text "Support" muted

    col:
      # Workspace card — identity + health + contextual actions live here, not in the topbar
      row justify=between:
        col:
          row:
            icon name="tech"
            text "core-api" bold size=large
          text "acme/core-api" muted size=small     # GitHub identity; JIRA is Project-scoped now
        row:
          status "Synced" kind=success
          text "Last synced 4m ago" muted size=small
          button "Sync" primary icon="check"       # per-repo action stays in the card

      tabs:
        tab "Dashboard"
        tab "Reports" active
        tab "Settings"                             # repo-level: Clusters (+ connector override)

      # ...tab content per repository-*.md (slim here to show composition only)
      section "Reports" badge="tab content in repository-reports.md":
        text "Toolbar + report grid render here" muted size=small
```
