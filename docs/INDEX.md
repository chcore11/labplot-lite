# Documentation Index

This file maps LabPlot Lite's guidance. Keep detailed rules in one canonical
place and keep tool-specific agent files short.

## Start Here

- `AGENTS.md`: root entry for Codex-style agents and the shortest hard-rule summary.
- `CONTRIBUTING.md`: human contributor workflow and PR expectations.

## Source Of Truth

| File | Owns | Do not put here |
| --- | --- | --- |
| `PRODUCT.md` | Users, purpose, positioning, anti-references, product principles | File ownership, verification commands, tool-specific agent rules |
| `DESIGN.md` | Visual system, layout, interaction, motion, information density, design tokens | Git workflow, module ownership, long implementation checklists |
| `.impeccable/design.json` | Machine-readable design tokens and design rules | Narrative process docs |
| `docs/engineering/frontend-contract.md` | Carbon + Plotly ownership, file responsibilities, dependency rules, checks | Product positioning or marketing copy |
| `docs/workflows/project-change-workflow.md` | Larger-change workflow, planning, self-review, publish checklist | Detailed design tokens or component docs |
| `docs/design/carbon-resources.md` | Official Carbon / IBM resource map and brand boundary | Project-specific implementation rules |
| `docs/adr/` | Architecture decisions and their consequences | Living how-to guidance |

## Auto-loaded Agent Entrypoints

These files exist so collaborators can use common agentic coding tools without
manually uploading project rules:

| Tool family | Entrypoint |
| --- | --- |
| Codex, Kimi Code, OpenCode, Cursor, Windsurf, Cline, and similar agents | `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code | `CLAUDE.md` |
| Gemini CLI | `GEMINI.md` |

Tool-specific files should stay short. If a rule changes, update the canonical
document first, then adjust the adapter only if its short summary becomes wrong.

## Project Skills

- `.agents/skills/impeccable/`: UI, visual design, interaction, motion, accessibility, and layout work.
- `.agents/skills/karpathy-guidelines/`: coding, review, and refactor behavior that favors simplicity, surgical edits, surfaced assumptions, and verifiable success criteria.

## Task Routing

- Product copy or scope: read `PRODUCT.md`.
- Visual design, landing page, layout, motion, UX cleanup: read `DESIGN.md`, `.impeccable/design.json`, and run the impeccable context loader.
- Workbench UI controls: read `docs/engineering/frontend-contract.md` and `docs/design/carbon-resources.md`.
- Plotly chart behavior, axes, legends, colors, fitting, export: read `docs/engineering/frontend-contract.md` and `docs/design/carbon-resources.md`.
- Larger cross-file changes, cleanup, self-review, or push-ready work: follow `docs/workflows/project-change-workflow.md`.
- CI, hooks, and quality gate rationale: read `docs/adr/0001-agent-quality-gates.md`.
