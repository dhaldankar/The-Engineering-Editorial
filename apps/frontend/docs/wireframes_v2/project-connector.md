# Project Connector

Wireloom wireframe of `docs/ui-mockups/project-connector.html`.

The Project-level "Connector" surface (sidebar, App Shell State 2). Manages the Project's data-source
connections — GitHub App install and Atlassian 3LO (§3) — storing encrypted tokens with versioned
columns for key rotation (§4.3). This is the **default** connector; a repository can override it in
its own Settings tab (repository → project fallback). "Connected" is a runtime `test_connectivity()`
call (§7 `POST test`), not a stored status.

```wireloom
window "Engineering Insights — Connector":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"
      text "Acme Engineering / Connector" muted
      row:
        button "Sync events (2)"
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" bold                        # active section
        text "Settings" muted
        divider
        text "Repositories" muted
        text "  core-api" muted
        text "  web-client" muted
        text "  data-pipeline" muted
        button "Add Repository" primary icon="plus"
        divider
        text "Support" muted

    col:
      panel:
        text "Data Sources" muted size=small
        text "Connector" bold size=large
        text "GitHub and Jira connections for this Project. Repositories inherit these unless they set an override." muted

      section "GitHub":
        slot "GitHub App" accent=success:
          status "Connected" kind=success            # via test_connectivity()
          text "Installation: acme · token v3" muted size=small
          text "Last rotated 12d ago" muted size=small     # versioned key columns
          row justify=end:
            button "Test"
            button "Manage"

      section "Jira":
        slot "Jira Software" accent=success:
          status "Connected" kind=success
          text "Cloud: acme.atlassian.net · token v1" muted size=small
          text "Space: PROJ (1-1 with this Project)" muted size=small
          row justify=end:
            button "Test"
            button "Re-auth"

      panel:
        icon name="authority"
        text "OAuth 2.0 / scoped tokens only. No raw credentials stored, keys rotate via versioned columns without re-auth, and tokens are never returned to the frontend." muted size=small
```
