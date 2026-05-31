---
name: react
description: Apply project React patterns for component structure, rendering performance, local model extraction, and module splitting. Use when building or refactoring components, pages, view models, lists, or UI state in this codebase.
---

# React

Prefer components that are small, explicit, and easy to diff.

Use these project defaults:

- Export reactive components with the project's standard wrapper pattern already used nearby.
- Keep child callback references stable.
- Split loop bodies into child components when the repeated markup is non-trivial.

Escalate structure when complexity grows:

- If local state and reactive logic remain small, keep them in the component.
- If reactive variables or orchestration become crowded, extract a local model.
- If a module grows, split it into nearby `components/`, `models/`, and `types.ts` instead of letting one file sprawl.

Performance rules:

- Avoid passing unstable heavy objects when a stable or copied value is expected by local patterns.
- Reuse existing memoization and observer patterns already established in the module.
- Prefer simple render logic and early returns over deeply nested JSX branches.

When editing existing UI, preserve the established structure instead of forcing a new abstraction style.
