# Repository Landing

Wireloom wireframe of `docs/ui-mockups/repository-landing.html`.

Reached by clicking the sidebar "Repositories" accordion title (App Shell State 2). Repository
cards: identity, sync health, last-synced, one hero metric (placeholder). Project tenant scope.

```wireloom
window "Engineering Insights — Repositories":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"
      text "Acme Engineering / Repositories" muted
      row:
        button "Sync events (2)"
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" muted
        text "Settings" muted
        divider
        text "Repositories" bold accent=research
        text "  core-api" muted
        text "  web-client" muted
        text "  data-pipeline" muted
        button "Add Repository" primary icon="plus"
        divider
        text "Support" muted

    col:
      row justify=between:
        col:
          text "Project" muted size=small
          text "Repositories" bold size=large
        row:
          input placeholder="Search repositories..." type=search
          button "Add Repository" primary icon="plus"

      row:
        slot "core-api" accent=success:
          status "Synced" kind=success
          text "acme/core-api" muted size=small
          text "Last synced 4m ago" muted size=small
          divider
          text "Hero metric" muted size=small
          text "—" bold size=large muted
        slot "web-client" accent=success:
          status "Synced" kind=success
          text "acme/web-client" muted size=small
          text "Last synced 22m ago" muted size=small
          divider
          text "Hero metric" muted size=small
          text "—" bold size=large muted
        slot "data-pipeline" accent=warning:
          spinner "Syncing..."
          text "acme/data-pipeline" muted size=small
          text "First sync in progress" muted size=small
          divider
          text "Hero metric" muted size=small
          text "—" bold size=large muted

      row:
        slot "Add repository":
          text "Connect a repo to this Project" muted size=small
          button "" icon="plus"
```
