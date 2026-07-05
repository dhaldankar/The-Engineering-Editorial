# Report Viewer — Editorial Brief

Wireloom wireframe of `docs/ui-mockups/report-viewer.html`.

The editorial brief for one report (§4.5, §9 `reportViewer`), reached from the Reports grid. A report
is an `async_reports` job plus the `report_signal` rows it fired; KPI numbers are read **live** from
`facts`, not stored. Signals compare a period against its predecessor. Metric viz is placeholder; the
signal/narrative structure is kept. Shown in the `completed` state (a generating report renders the
poll surface, `reports/{id}/status`, §8). Breadcrumb ends in the report period.

```wireloom
window "Engineering Insights — core-api":
  header:
    row justify=between:
      row:
        text "◎ Engineering Insights" bold
        button "Acme Engineering ▾"
      text "Acme Engineering / core-api / Reports / 2026-W06" muted
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
          text "Weekly Editorial Brief" bold size=large
          row:
            status "Completed" kind=success
            text "Week of Feb 2, 2026 · 2026-W06" muted size=small
            text "Generated 8m ago" muted size=small
        row:
          button "‹ Prev"
          button "Next ›"
          button "Regenerate" primary

      # KPI summary — read live from facts (§4.5). Values placeholder.
      row:
        slot "Metric A":
          text "—" bold size=large muted
          text "vs prev period" muted size=small
        slot "Metric B":
          text "—" bold size=large muted
          text "vs prev period" muted size=small
        slot "Metric C":
          text "—" bold size=large muted
          text "vs prev period" muted size=small
        slot "Metric D":
          text "—" bold size=large muted
          text "vs prev period" muted size=small

      # The brief — fired signals as editorial "stories" (report_signal rows)
      section "This period's signals" badge="3 fired":
        panel:
          row justify=between:
            row:
              icon name="warning" accent=danger
              text "Signal headline placeholder" bold
            chip "High" accent=danger
          text "Narrative placeholder — the templated story for this fired signal, with its magnitude versus the predecessor period." muted size=small
          divider
          text "Evidence" muted size=small
          panel:
            text "Frozen fact ids + values (report_signal.evidence) — viz placeholder" muted size=small
        panel:
          row justify=between:
            row:
              icon name="research" accent=research
              text "Signal headline placeholder" bold
            chip "Medium" accent=warning
          text "Narrative placeholder — drift comparison against the previous period." muted size=small
          divider
          text "Evidence" muted size=small
          panel:
            text "Evidence viz placeholder" muted size=small
        panel:
          row justify=between:
            row:
              icon name="research"
              text "Signal headline placeholder" bold
            chip "Low" accent=research
          text "Narrative placeholder." muted size=small
          divider
          text "Evidence" muted size=small
          panel:
            text "Evidence viz placeholder" muted size=small

      panel:
        icon name="policy"
        text "Composition is code, signals are config" bold size=small
        text "Which metrics and signals this report_type includes is defined alongside the metric registry (§4.5); each card above is one signal_config rule that crossed its threshold." muted size=small
```
