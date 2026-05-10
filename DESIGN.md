# LabPlot Lite Design Context

## Register
product

## Theme
Default to a Linear-inspired dark product surface: near-black page background, subtle borders, quiet text hierarchy, and a large product preview. Light mode remains supported for classrooms and printing, but the primary visual direction is dark and restrained.

## Color
- Use restrained product color: tinted neutrals plus one blue-violet accent.
- Prefer OKLCH tokens for surfaces, text, lines, focus rings, semantic states, and shadows.
- Avoid pure black and pure white; every neutral should have a slight cool or green tint.
- Accent color is for primary actions, active indicators, selected states, and data emphasis.
- Semantic states: success, warning, and danger must work on both themes and remain readable.

## Typography
- Use the system UI font stack with Chinese system fallbacks.
- Product headings should be confident but not billboard-sized.
- No fluid typography for product sections; use fixed rem sizes and breakpoint overrides.
- Labels and button text should be compact, high contrast, and consistent.

## Layout
- The product workbench is the center of the experience.
- The hero may borrow Linear's structure: quiet top navigation, large left-aligned headline, sparse supporting copy, and a real product-like preview.
- Avoid cards inside cards where a full-width work area or simple panel is enough.
- Use consistent panel borders, 16 to 28 px spacing, and compact form grids.
- Tables may scroll horizontally within their own container only.

## Components
- Buttons use one shape vocabulary: primary, secondary, neutral/download, and disabled.
- Inputs/selects share height, border, focus ring, background, and disabled styling.
- Messages and info boxes use the same border and tone system as panels.
- Interactive elements must define hover, focus-visible, active, and disabled states.

## Motion
- Motion is only for state feedback and light hover response.
- Use 150 to 220 ms ease-out transitions.
- Respect `prefers-reduced-motion` by removing smooth scroll and transform transitions.

## Accessibility
- Keep focus rings visible in both themes.
- Maintain at least 44 px touch targets on mobile.
- Avoid text overlap at 390 px width.
- Keep generated chart labels readable after theme changes.
