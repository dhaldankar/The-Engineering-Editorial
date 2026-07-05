# Repository Workspace — Dashboard

Wireloom wireframe of `docs/ui-mockups/repository-dashboard.html`.

Dashboard tab of the repository workspace, inside the App Shell (topbar + State-2 sidebar).
Placeholder cards; layout preserved for the Gold-fact redesign. Project tenant; Repository is the
GitHub identity (JIRA is Project-scoped).

```wireloom
window "Engineering Insights — core-api":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"
      text "Acme Engineering / core-api / Dashboard" muted
      row:
        button "Sync events (2)"
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" muted
        text "Settings" muted
        divider
        text "Repositories" bold
        text "  core-api" bold accent=research
        text "  web-client" muted
        text "  data-pipeline" muted
        button "Add Repository" primary icon="plus"
        divider
        text "Support" muted

    col:
      row justify=between:
        col:
          row:
            icon name="tech"
            text "core-api" bold size=large
          text "acme/core-api" muted size=small
        row:
          status "Synced" kind=success
          text "Last synced 4m ago" muted size=small
          button "Sync" primary icon="check"

      tabs:
        tab "Dashboard" active
        tab "Reports"
        tab "Settings"

      # Hero metric strip — reads Gold facts (metric_fact, §4.4). Content TBD.
      row:
        slot "Metric A":
          text "—" bold size=large muted
          text "Placeholder" muted size=small
        slot "Metric B":
          text "—" bold size=large muted
          text "Placeholder" muted size=small
        slot "Metric C":
          text "—" bold size=large muted
          text "Placeholder" muted size=small
        slot "Metric D":
          text "—" bold size=large muted
          text "Placeholder" muted size=small

      row:
        col:
          section "Primary View":
            text "Visualization placeholder — reads Gold facts (metric_fact)" muted size=small
            panel:
              text "Chart / table goes here" muted
        col 320:
          section "Signals":
            panel:
              text "Signal placeholder — report_signal / signal_config (§4.5)" muted size=small
          section "Secondary":
            panel:
              text "Placeholder card" muted size=small
```
