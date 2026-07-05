# Repository Settings — Clusters

Wireloom wireframe of `docs/ui-mockups/repository-settings.html`.

Repository-level Settings tab (repo workspace). Repo-scoped config only: **Clusters** and **Connector
override**. Clusters shown active. (JIRA Workflow Mapping and JIRA Configuration are Project-level —
see the `project-settings-*` files.) `code_clusters` carry a `curation_status`
(auto / confirmed / renamed / manual / archived); human-curated clusters survive recompute (§4.2).
`cluster_assignments` map one file → one cluster via longest-prefix match.

```wireloom
window "Engineering Insights — core-api":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"
      text "Acme Engineering / core-api / Settings" muted
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
        tab "Reports"
        tab "Settings" active

      row:
        col 200:
          panel:
            text "REPO SETTINGS" bold size=small muted
            text "Clusters" bold
            text "Connector override" muted           # repo override of the Project connector
        col:
          row justify=between:
            col:
              text "Code Areas" muted size=small
              text "Clusters" bold size=large
              text "Files grouped by longest-prefix match. Human-curated clusters survive recompute." muted size=small
            row:
              button "Import JSON"
              button "Recompute"
              button "Add Cluster" primary icon="plus"

          section "Clusters" badge="5 active":
            row:
              col:
                text "Name" bold size=small muted
              col:
                text "File pattern" bold size=small muted
              col 140:
                text "Curation" bold size=small muted
              col 100:
                text "Files" bold size=small muted
            divider
            row:
              col:
                text "API"
              col:
                text "src/api/**" muted size=small
              col 140:
                chip "confirmed" accent=success
              col 100:
                text "142"
            row:
              col:
                text "Auth"
              col:
                text "src/auth/**" muted size=small
              col 140:
                chip "manual" accent=research
              col 100:
                text "38"
            row:
              col:
                text "Database"
              col:
                text "src/db/**" muted size=small
              col 140:
                chip "renamed" accent=research
              col 100:
                text "64"
            row:
              col:
                text "UI Components"
              col:
                text "src/components/**" muted size=small
              col 140:
                chip "auto"
              col 100:
                text "210"
            row:
              col:
                text "Legacy Jobs"
              col:
                text "src/jobs/**" muted size=small
              col 140:
                chip "archived" accent=warning
              col 100:
                text "17"

          panel:
            icon name="policy"
            text "Recompute reassigns files by longest-prefix match but never overwrites confirmed / renamed / manual clusters (§4.2)." muted size=small
```
