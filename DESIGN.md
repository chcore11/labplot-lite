# LabPlot Lite Design Context

## Register
product

## Theme
Default to a Linear-inspired dark product workbench: near-black page background, precise borders, dense tool surfaces, a persistent left workflow sidebar, and quiet text hierarchy. Light mode remains supported for classrooms and printing, but dark mode is the primary authored surface.

## Color
- Use restrained product color: tinted neutrals plus one blue-violet accent.
- Prefer OKLCH tokens for surfaces, text, lines, focus rings, semantic states, and shadows.
- Avoid pure black and pure white; every neutral should have a slight cool tint.
- Accent color is reserved for primary actions, active steps, selected states, and chart emphasis.
- Semantic states must include info, success, warning, and danger and remain readable in both themes.

## Typography
- Use the system UI font stack with Chinese system fallbacks.
- Product headings should be compact and confident, not billboard-sized.
- Use fixed rem sizes with breakpoint overrides; do not scale typography continuously with viewport width.
- Labels, buttons, table text, and metrics should be tight, readable, and consistent.

## Layout
- The workbench is the product center: a left step sidebar and a right task panel.
- The flow is import data, identify range, optional data processing, configure plot, review result.
- Keep the hero short and functional, with a real product-like preview instead of a marketing composition.
- Avoid nested cards. Use full-width bands, bordered panels, split panes, and dense rows.
- Tables may scroll horizontally within their own container only.

## Components
- Buttons use one vocabulary: primary, secondary, ghost/sidebar, neutral/download, disabled.
- Inputs and selects share height, border, background, focus ring, hover, active, disabled, and error states.
- Step navigation exposes active, available, locked, and complete states.
- Messages, readiness checks, info boxes, metrics, and downloads share the same border and tone system.
- The generated result prioritizes fit equation, R², RMSE, MAE, valid point count, and ZIP export.

## Motion
- Motion is only for state feedback, reveal, focus, and hover response.
- Use 150 to 220 ms ease-out transitions.
- Respect `prefers-reduced-motion` by removing smooth scroll and transform transitions.

## Accessibility
- Keep focus rings visible in both themes.
- Maintain at least 44 px touch targets on mobile.
- Use `aria-current` for the active workflow step and disable unavailable steps.
- Avoid text overlap at 390 px width.
- Keep generated chart labels readable after theme changes.
