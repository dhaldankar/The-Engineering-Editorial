# Project Settings — JIRA Workflow Mapping

Wireloom wireframe of `docs/ui-mockups/project-settings-workflow.html`.

The JIRA Workflow Mapping sub-section of Project Settings. Maps the Project's JIRA status strings to
the six canonical lifecycle phases. Because JIRA is Project-scoped (1-1), the mapping is **per-Project**:
`UNIQUE(project_id, jira_status)` — a change from ARCHITECTURE.md §4.3's repo-scoped key (doc follow-up
pending). Canonical phases: `backlog → ready → in_dev → str → qa → done`. An unmapped status can be
inferred with an LLM (`POST .../infer`) and confirmed.

```wireloom
window "Engineering Insights — Project Settings":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"
      text "Acme Engineering / Settings / JIRA Workflow Mapping" muted
      row:
        button "Sync events (2)"
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" muted
        text "Settings" bold
        divider
        text "Repositories" muted
        text "  core-api" muted
        text "  web-client" muted
        text "  data-pipeline" muted
        button "Add Repository" primary icon="plus"
        divider
        text "Support" muted

    col:
      row:
        col 200:
          panel:
            text "PROJECT SETTINGS" bold size=small muted
            text "Metadata" muted
            text "User Access — locked" muted
            text "JIRA Workflow Mapping" bold
            text "JIRA Configuration" muted

        col:
          row justify=between:
            col:
              text "Lifecycle" muted size=small
              text "JIRA Workflow Mapping" bold size=large
              text "Map this Project's JIRA statuses to the six canonical phases." muted size=small
            row:
              button "Infer unmapped"                 # POST .../infer (LLM)
              button "Save" primary icon="check"

          # Canonical target vocabulary (fixed, ordered)
          row:
            chip "backlog"
            chip "ready"
            chip "in_dev"
            chip "str"
            chip "qa"
            chip "done"

          section "Status → Phase" badge="6 mapped · 1 unmapped":
            row:
              col:
                text "Jira status" bold size=small muted
              col 200:
                text "Canonical phase" bold size=small muted
              col 120:
                text "State" bold size=small muted
            divider
            row:
              col:
                text "Backlog"
              col 200:
                text "backlog"
              col 120:
                text "mapped" muted size=small
            row:
              col:
                text "To Do"
              col 200:
                text "ready"
              col 120:
                text "mapped" muted size=small
            row:
              col:
                text "In Progress"
              col 200:
                text "in_dev"
              col 120:
                text "mapped" muted size=small
            row:
              col:
                text "In Review"
              col 200:
                text "str"
              col 120:
                text "mapped" muted size=small
            row:
              col:
                text "QA"
              col 200:
                text "qa"
              col 120:
                text "mapped" muted size=small
            row:
              col:
                text "Done"
              col 200:
                text "done"
              col 120:
                text "mapped" muted size=small
            divider
            row:
              col:
                text "Ready for Deploy" accent=warning
              col 200:
                text "— select phase —" muted
              col 120:
                chip "inferred: done?" accent=research    # LLM suggestion, awaiting confirm
```
