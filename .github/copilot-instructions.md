# LabPlot Lite Copilot Instructions

Start with `AGENTS.md`. For non-trivial work, also read `PRODUCT.md`,
`DESIGN.md`, `docs/engineering/frontend-contract.md`, and
`docs/workflows/project-change-workflow.md`.

Hard rules:

- Keep the Carbon + Plotly architecture: Carbon owns generic UI, Plotly owns scientific charts and export.
- Do not add a parallel UI system, chart engine, or duplicated control helper layer.
- Use real Plotly output for chart previews and samples; do not hand-draw fake curves.
- For UI work, preserve the report-paper plus instrument-panel feel from `DESIGN.md`.
- Prefer deletion and consolidation over adding wrappers. Do not repeat the same information or entry point in the same view.
- Before committing frontend changes, run `./scripts/check.sh`; for docs-only changes, at least run `git diff --check`.
