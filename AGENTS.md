# Agent Coding Guide

This is the root instruction file for coding agents working on LabPlot Lite.
Keep it short. Detailed product, design, engineering, and workflow rules live in
`docs/` so other agentic coding tools can load the same standards without manual
file uploads.

## First Read

For any non-trivial change, read in this order:

1. `PRODUCT.md` - product purpose, users, anti-references, and product principles.
2. `DESIGN.md` - visual system, layout, interaction, and UX rules.
3. `docs/engineering/frontend-contract.md` - Carbon + Plotly ownership, file boundaries, dependencies, and checks.
4. `docs/workflows/project-change-workflow.md` - required workflow for larger changes.
5. Relevant files under `docs/design/` and `docs/adr/`.

Use `docs/INDEX.md` when you need a map of all project guidance.

## Core Contract

LabPlot Lite is a static browser app for student scientific plotting. Keep the
app lightweight, report-ready, and easy to change.

- Carbon Web Components own generic workbench UI.
- Plotly.js owns scientific chart rendering, interaction, and image export.
- Project JavaScript owns LabPlot-specific workflow, data handling, fitting, metrics, and export payloads.
- Project CSS owns brand tokens, page layout, Plotly shell layout, and minimal Carbon layout adaptation.
- Do not grow a parallel UI system or a parallel chart engine.

## Required Work Loop

1. Inspect: run `git status --short --branch`, then read the relevant docs and owner files.
2. Align: identify whether the change affects product, design, UI, plotting, parsing, fitting, export, samples, deployment, or docs.
3. Reuse: check Carbon, Plotly, existing helpers, and established module boundaries before adding code.
4. Edit: keep the patch scoped. Prefer deleting or replacing old code over layering new wrappers.
5. Verify: run the smallest real check that proves the change works.
6. Review: inspect `git diff --stat` and key diffs for redundancy, ownership drift, and unused files.
7. Publish: when the task asks for completion on the remote, pull with rebase, commit, push, and confirm branch sync.

For larger changes, use `docs/workflows/project-change-workflow.md` before editing.

## Non-negotiable Rules

- Use Chinese for user-facing summaries unless the user asks otherwise.
- Treat screenshots from the user as concrete bug reports and verify visible UI changes visually.
- Do not revert collaborator or user changes unless explicitly asked.
- If Carbon or Plotly already covers the behavior, use it and write only LabPlot-specific glue.
- If Carbon cannot cover a generic UI need, document the exception in the same change.
- If a patch grows code, check what old path, duplicated style, or helper can be removed.
- Do not add native `input`, `select`, `textarea`, `button`, `details`, or `table` controls to `workbench.html` unless the exception is documented.
- Keep one fact in one canonical file. Tool-specific files should point here and to detailed docs instead of copying long rules.

## Project Skills

- Use `.agents/skills/karpathy-guidelines/SKILL.md` for coding, review, and refactor work when the environment supports project skills.
- Use `.agents/skills/impeccable/SKILL.md` for UI, design, layout, interaction, motion, accessibility, or visual cleanup work.

## UI And Design

For UI, design, layout, interaction, motion, accessibility, or visual cleanup:

```bash
node .agents/skills/impeccable/scripts/load-context.mjs
```

Then follow `DESIGN.md`, `.impeccable/design.json`, and
`docs/design/carbon-resources.md`.

## Verification

Before committing frontend changes, run:

```bash
./scripts/check.sh
```

If the shell script is unavailable, run the equivalent checks from
`docs/engineering/frontend-contract.md`.

For visible UI changes, also check desktop and a narrow mobile width. For chart
or export changes, verify a complete workbench flow: load a sample, apply a
preset, generate the Plotly chart, confirm the result summary, and populate PNG,
SVG, CSV, TXT, and ZIP downloads.

## Publishing

- Work on the current branch unless the user asks for a separate branch.
- Before push, check `git status --short --branch`.
- If `main` diverged from `origin/main`, run `git pull --rebase origin main`.
- Do not force-push unless the user explicitly asks for history rewrite.
- Keep commits focused and named after the product-level change.
- After pushing, confirm the commit hash and that `main...origin/main` is clean.
