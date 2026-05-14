# Large Change Workflow

This workflow applies to larger LabPlot Lite changes: landing page, workbench UI,
plotting features, data handling, export, sample data, design system, docs, and
collaboration rules. The goal is to align boundaries first, implement second,
and self-review before publishing.

## When To Use

Use this workflow when any condition is true:

- The change crosses multiple files or responsibility boundaries.
- The change affects the user path, landing page, workbench steps, plotting, fitting, export, or sample data.
- The change adds UI, interaction, chart capability, dependency, design token, or project guidance.
- The user asks for polish, refactor, redundancy reduction, self-review, strict compliance, or push-ready verification.
- You are unsure whether the change might introduce duplicate logic, a parallel UI system, or a parallel chart layer.

Small typo fixes, one-line copy edits, and obvious low-risk docs link fixes can
use the shorter `AGENTS.md` work loop.

## 1. Preflight

1. Run `git status --short --branch`.
2. Read `AGENTS.md`, `README.md`, `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, and relevant `docs/` files.
3. If UI, design, layout, motion, interaction, or visual cleanup is involved, run `node .agents/skills/impeccable/scripts/load-context.mjs`.
4. Identify the affected area: product, design, UI components, plotting, parsing, fitting, export, samples, deployment, or docs.
5. Write a plan before editing. The plan must say what will be deleted, narrowed, or reused.

## 2. Plan First

The plan must answer:

- Which user path does this change serve?
- Which behavior belongs to Carbon, Plotly, or project code?
- Which owner files need to be read or edited?
- Which old logic, old styles, duplicate entry points, or outdated copy will be removed?
- What is the smallest verification path?

If the plan cannot describe boundaries and verification, keep reading before editing.

## 3. Implementation Boundaries

- Generic UI defaults to Carbon Web Components.
- Scientific plotting defaults to Plotly trace, layout, and config.
- Carbon control glue belongs in `static/js/01-dom-workflow-utils.js`.
- Plotly assembly belongs in `static/js/06-plot-build-render.js`.
- Event wiring belongs in `static/js/08-events-init.js`.
- Download payloads belong in `static/js/07-downloads-result.js`.
- CSS only owns layout, brand tokens, Plotly shells, and necessary Carbon adaptation.
- When code volume grows, first look for old paths or helpers that can be deleted or reused.

## 4. Design And UX Checks

For visible UI changes, check:

- The product still feels like a student lab report plotting tool, not generic SaaS, an AI tool, or a complex Origin clone.
- The main path remains clear: import, check, configure, plot, export.
- Landing and samples use real Plotly chart output, not hand-written fake curves.
- Blue is only used for primary actions, links, current state, and interactive focus.
- No new homogeneous card grid, hero metric strip, glassmorphism, gradient text, or heavy marketing copy.
- At 390px width, text, buttons, tables, charts, and sample previews do not overlap.
- Clickable targets and non-clickable previews are visually and behaviorally distinct.

## 5. Verification

Before commit, run:

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

Supplement by impact:

- UI / layout: browser-check desktop and 390px width.
- Workbench: load sample, apply preset, generate Plotly chart, confirm summary.
- Chart / export: confirm PNG, SVG, CSV, TXT, and ZIP paths.
- Samples: confirm sample files, preview charts, URL params, and preset behavior.
- Docs-only: at least run `git diff --check` and inspect link paths.

## 6. Self-review

Review in this order:

1. Subtraction: remove redundant entry points, duplicate styles, hidden old paths, and over-explaining copy. Do not show the same information, entry, state, or sample explanation multiple times in the same view unless it serves a different task layer.
2. Product fit: confirm the change still serves student lab plotting and report output.
3. Ownership: confirm there is no new UI system beside Carbon or chart system beside Plotly.
4. Boundaries: confirm code lives in the correct owner files.
5. Interaction: confirm primary actions, feedback, disabled states, and errors are natural.
6. Responsive: confirm desktop and 390px views are clear, spacious enough, and free of incoherent overflow.
7. Publish: commit only after the diff is reasonable; before pushing run `git pull --rebase origin main`.

## 7. Publish

Before push, confirm:

- `git status --short --branch` shows only relevant changes.
- `git diff --stat` matches the plan.
- The commit message describes the product-level change.
- After push, `main...origin/main` is clean.
