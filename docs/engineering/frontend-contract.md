# Frontend Engineering Contract

This is the canonical implementation contract for LabPlot Lite. Other docs may
refer to these rules, but should not copy the full checklist.

## Stack Ownership

Use the Carbon + Plotly architecture for all frontend work:

- IBM Carbon Web Components own generic workbench UI.
- Plotly.js owns scientific chart rendering, interaction, and image export.
- Project JavaScript owns LabPlot-specific workflow, data handling, fitting, metrics, and package export.
- Project CSS owns brand tokens, page layout, Plotly shell layout, and minimal Carbon layout adaptation.

If Carbon or Plotly already covers the behavior, do not hand-write it.

## Carbon-first UI

Use Carbon Web Components for generic UI:

- `cds-button` for actions and downloads.
- `cds-progress-indicator` / `cds-progress-step` for workflow steps.
- `cds-file-uploader` and `cds-file-uploader-button` for file selection.
- `cds-select`, `cds-text-input`, `cds-textarea`, `cds-number-input`, `cds-checkbox` for forms.
- `cds-actionable-notification` / `cds-inline-notification` for status, success, warning, and error messaging.
- `cds-table` for spreadsheet preview.
- `cds-accordion` for advanced or progressive settings.
- `cds-tag` for compact metadata and column labels.

Do not add new native `input`, `select`, `textarea`, `button`, `details`, or
`table` controls to `workbench.html` unless there is a specific browser/platform
reason and the exception is documented in the same change.

Use `docs/design/carbon-resources.md` before adding or replacing generic UI.

## Plot Ownership

Use Plotly for chart work:

- Add chart types as Plotly traces.
- Add axis, legend, size, toolbar, and export behavior through Plotly layout/config.
- Keep Plotly assembly in `static/js/06-plot-build-render.js`.
- Keep fitting math in `static/js/05-fit.js`.
- Keep readiness checks in `static/js/04-plot-readiness.js`.
- Keep download payloads in `static/js/07-downloads-result.js`.

Do not write a custom canvas or SVG chart engine for scientific plots.

Use the IBM / Carbon data visualization links in
`docs/design/carbon-resources.md` before changing axes, labels, legends, grid
density, chart color, direct labels, or missing-data treatment. Apply that
guidance through Plotly trace, layout, and config rather than a parallel chart
layer.

## File Responsibilities

- `workbench.html`: static app shell, minimal startup Carbon imports, Carbon component markup.
- `static/js/00-config-state.js`: constants, shared state, external library and lazy Carbon component manifests.
- `static/js/01-dom-workflow-utils.js`: DOM helpers, Carbon control read/write helpers, lazy Carbon loading, workflow utilities.
- `static/js/02-data-parse.js`: CSV / Excel parsing and table normalization.
- `static/js/03-workbench-ui.js`: workbench UI rendering, preview rows, dynamic Carbon controls.
- `static/js/04-plot-readiness.js`: validation before plotting.
- `static/js/05-fit.js`: fitting and metrics.
- `static/js/06-plot-build-render.js`: Plotly traces, layout, rendering, chart config.
- `static/js/07-downloads-result.js`: download links, PNG/SVG/CSV/TXT/ZIP payloads, result summary.
- `static/js/08-events-init.js`: event wiring and startup.
- `static/styles/base.css`: tokens and global primitives.
- `static/styles/navigation.css`: shared navigation layout.
- `static/styles/landing.css`: landing page layout and product preview composition.
- `static/styles/workbench.css`: workbench layout, not Carbon visual reimplementation.
- `static/styles/plot.css`: Plotly shell, result layout, summary and downloads layout.
- `static/styles/footer.css`, `responsive.css`, `motion.css`: shared footer, responsive rules, and motion rules.

When a feature crosses these boundaries, keep each piece in its owner file
instead of adding a large local implementation in one module.

## CSS Rules

- Do not recreate Carbon controls with custom `.btn`, `.input`, `.select`, `.table`, `.notification`, or accordion styles.
- Do not style Carbon internals unless there is no stable public alternative.
- CSS may set layout, width, grid, spacing, brand tokens, and Plotly container dimensions.
- Delete obsolete custom UI styles when replacing UI with Carbon.
- Avoid one-off visual patches that only work for one current screen size.

## Adding UI

1. Search Carbon Web Components and existing `cds-*` patterns in `workbench.html`.
2. Use Carbon markup before writing any native control or custom visual primitive.
3. Use helpers in `static/js/01-dom-workflow-utils.js` for value, checked, disabled, and options handling.
4. Add only the smallest wrapper code needed to connect Carbon events to app state.
5. Remove old native control markup or duplicated styles.
6. Verify keyboard focus and 390px mobile layout if the change affects visible workflow.

## Adding Chart Features

1. Prefer a Plotly trace/layout/config option.
2. Extend existing chart constants and trace builders.
3. Keep user-facing controls as Carbon components.
4. Keep fit metrics and export summaries consistent with existing result output.
5. Verify PNG, SVG, CSV/TXT, and ZIP outputs if the plot payload changes.

## Dependency Rules

Allowed browser libraries are currently:

- SheetJS for spreadsheet reading.
- IBM Carbon Web Components for UI.
- Plotly.js for charts and chart export.
- JSZip for ZIP package generation.

Do not add another UI library, chart library, or utility dependency unless it
replaces a meaningful amount of project code or covers a capability Carbon /
Plotly cannot cover. Document the reason in `README.md` when adding a dependency.

## Verification

Run these before committing frontend changes:

```bash
./scripts/check.sh
```

If the shell script is unavailable, run:

```bash
for f in static/js/*.js static/theme.js; do node --check "$f" || exit 1; done
git diff --check
node scripts/check-workbench-controls.mjs
node scripts/check-architecture.mjs
```

For workbench UI changes, the native-control check should return no matches
unless the change intentionally documents an exception.

For chart or workflow changes, run a local static server and verify a complete
flow:

```bash
./scripts/serve.sh
```

Then open `http://127.0.0.1:8000/workbench.html`, load a sample dataset, apply a
sample plotting preset, generate the Plotly chart, confirm the result summary,
confirm PNG / SVG / CSV / TXT download links, and click ZIP once to confirm the
lazy package is generated.
