# Repository Workspace — Reports

Wireloom wireframe of `docs/ui-mockups/repository-reports.html`.

Reports tab of the repository workspace. Lists `async_reports` jobs (§4.5); status/stage doubles as
the poll surface (§8). Completed cards open the report viewer; generating shows progress; failed
retries. Generating is `POST reports`, idempotent per `UNIQUE(project_id, repo_id, report_type, period)`.

```wireloom
window "Engineering Insights — core-api":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"
      text "Acme Engineering / core-api / Reports" muted
      row:
        button "Sync events (2)"
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" muted
        text "Settings" muted
        divider
        text "Repositories" muted
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
        tab "Dashboard"
        tab "Reports" active
        tab "Settings"

      row justify=between:
        col:
          text "Reports" bold size=large
          text "Time-bound editorial briefs (async_reports)" muted size=small
        row:
          button "Filter"
          button "Generate report" primary icon="plus"

      row:
        slot "Weekly Editorial · 2026-W06" accent=success:
          status "Completed" kind=success
          text "Feb 2 – Feb 8, 2026" muted size=small
          text "Generated 8m ago · 3 signals" muted size=small
          row justify=end:
            button "" icon="gear"
            button "Open"
        slot "Weekly Editorial · 2026-W05" accent=success:
          status "Completed" kind=success
          text "Jan 26 – Feb 1, 2026" muted size=small
          text "Generated 7d ago · 1 signal" muted size=small
          row justify=end:
            button "" icon="gear"
            button "Open"
        slot "Weekly Editorial · 2026-W07" accent=research:
          spinner "Generating..."
          text "Feb 9 – Feb 15, 2026" muted size=small
          progress value=60 max=100 label="Computing signals"
          text "Stage: signals · polling status" muted size=small

      row:
        slot "Monthly Rollup · Jan 2026" accent=danger:
          status "Failed" kind=error
          text "Jan 1 – Jan 31, 2026" muted size=small
          text "Worker error · retry 2 of 3" muted size=small
          row justify=end:
            button "View error"
            button "Retry" primary
        slot "Generate a report":
          text "Pick a report type and period" muted size=small
          button "" icon="plus"
```
