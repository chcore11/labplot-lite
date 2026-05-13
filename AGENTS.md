# Agent Coding Guide

This file is the first stop for any coding agent working on LabPlot Lite.

LabPlot Lite is a static browser app for student scientific plotting. Keep the app lightweight, report-ready, and easy to change. Do not grow a parallel UI system or a parallel chart engine.

## Core Contract

Use the Carbon + Plotly architecture for all frontend work:

- IBM Carbon Web Components own generic workbench UI.
- Plotly.js owns scientific chart rendering, interaction, and image export.
- Project JavaScript owns LabPlot-specific workflow, data handling, fitting, metrics, and package export.
- Project CSS owns brand tokens, page layout, Plotly shell layout, and minimal Carbon layout adaptation.

If Carbon or Plotly already covers the behavior, do not hand-write it.

## Collaboration Norms

The user expects concrete completion, not only proposals. When the request is actionable, make the change, verify it, commit it when appropriate, and push when the task asks for completion on `main` or continues an already-pushing workflow.

Default collaboration behavior:

- Prefer doing the work over explaining possible work.
- Keep updates concise and factual, especially during long edits or verification.
- Use Chinese for user-facing summaries unless the user asks otherwise.
- Preserve the product direction already established in `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, and this file.
- Treat screenshots from the user as concrete bug reports. If the issue is visual, verify visually instead of relying only on code inspection.
- If the user points out a UI problem such as overlap, blockage, duplicated entry points, or confusing flow, fix the visible issue directly and then run the relevant workflow test.
- If the user asks for cleanup, actually delete obsolete code, duplicated styles, old branches of logic, and unused files. Do not leave deprecated UI paths hidden in the repo.
- If a change starts increasing code volume, stop and check whether Carbon, Plotly, or an existing helper already owns the behavior.
- Do not revert collaborator or user changes unless explicitly asked. Work with the current tree.

## Standard Work Loop

For non-trivial repo work, follow this loop:

1. Inspect: run `git status --short --branch`, read the relevant docs, and inspect existing code before deciding.
2. Align: identify whether the change affects product, design, UI components, plotting, parsing, fitting, export, deployment, or docs.
3. Reuse: look for existing helpers, Carbon components, Plotly options, and established module boundaries before adding code.
4. Edit: keep the patch scoped. Prefer replacing or deleting old code over layering new code on top.
5. Verify: run static checks and the smallest real user flow that proves the change works.
6. Review: inspect `git diff --stat` and key diffs. Confirm the change did not add redundant UI or duplicate chart logic.
7. Publish: if the task requires completion on the remote, commit with a clear message and push to `origin main`.

## UI And Design Workflow

For UI, design, layout, interaction, motion, accessibility, or visual cleanup work:

- Use the project-local impeccable context before editing:

  ```bash
  node .agents/skills/impeccable/scripts/load-context.mjs
  ```

- Treat `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` as source files, not optional commentary.
- If those files are stale relative to a major design direction, refresh or update the contract first.
- Keep the workbench's Datawrapper-like linear path visible: upload, describe/check, visualize, export.
- Keep the product feel: student lab report tool, lightweight Origin alternative, report paper plus instrument panel.
- Do not drift into generic SaaS, AI-tool, glassmorphism, dark-gradient, or marketing-page styling.
- Use browser verification for visible UI changes. Check desktop and a narrow mobile width when layout could be affected.

## Refactor And Cleanup Workflow

The user's repeated preference is less redundancy and less hand-rolled UI.

When refactoring:

- Delete replaced native controls, old CSS selectors, duplicate helper logic, and unused paths in the same change.
- Keep glue code centralized. Carbon control read/write logic belongs in `static/js/01-dom-workflow-utils.js`.
- Keep chart assembly centralized. Plotly traces and layouts belong in `static/js/06-plot-build-render.js`.
- Keep event wiring in `static/js/08-events-init.js`; do not hide workflow state changes inside rendering helpers.
- Keep docs honest. If architecture or dependencies change, update `README.md`, `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, or this file as needed.
- Favor net code reduction when replacing custom UI with Carbon or custom plotting with Plotly.

## Git And Publishing Workflow

- Work on the current branch unless the user asks for a separate branch.
- Before push, check `git status --short --branch`.
- If `main` diverged from `origin/main`, use `git pull --rebase origin main` before pushing.
- Do not force-push unless the user explicitly asks for history rewrite.
- Keep commits focused and named after the product-level change.
- After pushing, confirm the commit hash and that `main...origin/main` is clean.

## Read Before Editing

Read these files before non-trivial changes:

- `README.md`: app overview, local preview, deployment, library list.
- `PRODUCT.md`: product purpose, anti-references, implementation contract.
- `DESIGN.md`: visual system and component ownership rules.
- `.impeccable/design.json`: machine-readable design-system contract.

For UI, design, layout, or interaction work, use the project-local impeccable flow first:

```bash
node .agents/skills/impeccable/scripts/load-context.mjs
```

## Component Ownership

Use Carbon Web Components for generic UI:

- `cds-button` for actions and downloads.
- `cds-progress-indicator` / `cds-progress-step` for workflow steps.
- `cds-file-uploader` and `cds-file-uploader-button` for file selection.
- `cds-select`, `cds-text-input`, `cds-textarea`, `cds-number-input`, `cds-checkbox` for forms.
- `cds-actionable-notification` / `cds-inline-notification` for status, success, warning, and error messaging.
- `cds-table` for spreadsheet preview.
- `cds-accordion` for advanced or progressive settings.
- `cds-tag` for compact metadata and column labels.

Do not add new native `input`, `select`, `textarea`, `button`, `details`, or `table` controls to `workbench.html` unless there is a specific browser/platform reason and the alternative is documented in the same change.

## Plot Ownership

Use Plotly for chart work:

- Add chart types as Plotly traces.
- Add axis, legend, size, toolbar, and export behavior through Plotly layout/config.
- Keep Plotly assembly in `static/js/06-plot-build-render.js`.
- Keep fitting math in `static/js/05-fit.js`.
- Keep readiness checks in `static/js/04-plot-readiness.js`.
- Keep download payloads in `static/js/07-downloads-result.js`.

Do not write a custom canvas or SVG chart engine for scientific plots.

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
- `static/styles/workbench.css`: workbench layout, not Carbon visual reimplementation.
- `static/styles/plot.css`: Plotly shell, result layout, summary and downloads layout.

When a feature crosses these boundaries, keep each piece in its owner file instead of adding a large local implementation in one module.

## CSS Rules

- Do not recreate Carbon controls with custom `.btn`, `.input`, `.select`, `.table`, `.notification`, or accordion styles.
- Do not style Carbon internals unless there is no stable public alternative.
- CSS may set layout, width, grid, spacing, brand tokens, and Plotly container dimensions.
- Delete obsolete custom UI styles when replacing UI with Carbon.
- Avoid one-off visual patches that only work for one current screen size.

## Adding UI

When adding UI:

1. Search for existing `cds-*` patterns in `workbench.html`.
2. Use helpers in `static/js/01-dom-workflow-utils.js` for value, checked, disabled, and options handling.
3. Add only the smallest wrapper code needed to connect Carbon events to app state.
4. Remove any old native control markup or duplicated styles.
5. Verify keyboard focus and 390px mobile layout if the change affects visible workflow.

## Adding Chart Features

When adding chart capability:

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

Do not add another UI library, chart library, or utility dependency unless it replaces a meaningful amount of project code or covers a capability Carbon / Plotly cannot cover. Document the reason in `README.md` when adding a dependency.

## Verification Checklist

Run these before committing frontend changes:

```bash
for f in static/js/*.js static/theme.js; do node --check "$f" || exit 1; done
git diff --check
```

For workbench UI changes, also check:

```bash
rg -n "<(input|select|textarea|button|details|table)\\b" workbench.html
```

That command should return no matches unless the change intentionally documents an exception.

For chart or workflow changes, run a local static server and verify a complete flow:

```bash
python3 -m http.server 8000
```

Then test:

- open `http://127.0.0.1:8000/workbench.html`
- load a sample dataset
- apply a sample plotting preset
- generate the Plotly chart
- confirm result summary appears
- confirm PNG / SVG / CSV / TXT download links are populated
- click the ZIP download once and confirm the lazy ZIP package is generated

## Commit Hygiene

- Keep changes scoped to the requested behavior.
- Prefer deleting duplicated code over layering new wrappers.
- Do not rewrite product/design docs unless the requested change alters the product contract.
- Do not revert user or collaborator changes unless explicitly asked.
- If pushing, use normal `git pull --rebase origin main` before considering any force operation.
