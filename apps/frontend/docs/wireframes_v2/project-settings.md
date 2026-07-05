# Project Settings

Wireloom wireframe of `docs/ui-mockups/project-settings.html`.

Project-level settings, reached from the sidebar "Settings" entry (App Shell State 2). A Project is
the tenant, 1-1 with a JIRA space. Sub-sections: **Metadata**, **User Access** (post-MVP, locked),
**JIRA Workflow Mapping**, **JIRA Configuration**. Metadata shown active.

Placement note: JIRA Workflow Mapping moves here from the repository level — JIRA is Project-scoped,
so status→phase mapping is per-Project (was repo-scoped in ARCHITECTURE.md §4.3; the doc needs a
follow-up edit). Clusters stay a *repository* Settings tab (code areas are per-repo).

```wireloom
window "Engineering Insights — Project Settings":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"                # Project switcher
      text "Acme Engineering / Settings" muted     # breadcrumb: Project-level, no repo crumb
      row:
        button "Sync events (2)"
        avatar "U"

  row:
    col 240:
      panel:
        text "Connector" muted
        text "Settings" bold                        # active section
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
            text "Metadata" bold
            text "User Access — locked" muted        # post-MVP
            text "JIRA Workflow Mapping" muted
            text "JIRA Configuration" muted

        col:
          row justify=between:
            col:
              text "Project" muted size=small
              text "Metadata" bold size=large
              text "Identity for this Project (1-1 with its JIRA space)." muted size=small
            button "Save" primary icon="check"

          section "General":
            text "Project name" bold size=small muted
            input placeholder="Acme Engineering" type=text
            text "Description" bold size=small muted
            input placeholder="Short summary shown on dashboards" type=text

          section "JIRA space" badge="1-1":
            text "Linked space" bold size=small muted
            text "acme.atlassian.net · PROJ" muted
            text "Connection managed under JIRA Configuration; status→phase under JIRA Workflow Mapping." muted size=small italic

          panel:
            icon name="policy"
            text "User Access (roles, invitations) is planned post-MVP — the section stays visible but disabled to teach the model." muted size=small
```
