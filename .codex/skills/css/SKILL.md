---
name: css
description: Apply project styling conventions for Tailwind CSS and CSS Modules. Use when implementing layouts, component styling, visual states, responsive tweaks, or deciding whether styling belongs in utility classes or a local CSS module.
---

# CSS

Choose the simplest styling mechanism that keeps the code readable.

Prefer Tailwind for:

- Layout, spacing, sizing, positioning, and typography.
- Short-lived or local utility styling.
- Fast iteration on straightforward component markup.

Prefer CSS Modules for:

- Complex hover, active, focus, and combined state logic.
- Animations, nested selectors, and repeated complex patterns.
- Cases where the Tailwind class string stops being readable.

Use these project conventions:

- Split long `className` strings across multiple lines.
- Keep utility ordering readable by grouping layout, spacing, then visual styles.
- Use shared utility classes when they already exist instead of recreating them.
- Keep CSS Modules local and scoped to the component or module that owns them.

When adding styles:

- Preserve existing visual language instead of introducing a new one.
- Reuse existing variables, utility classes, and layout patterns first.
- Avoid mixing Tailwind and CSS Modules in a way that obscures the final source of truth.
