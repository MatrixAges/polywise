---
name: typescript
description: Apply project TypeScript conventions for naming, file organization, imports, and strict typing. Use when writing or refactoring TypeScript files, especially for shared types, component props, models, or utility modules in this codebase.
---

# TypeScript

Write TypeScript that is strict, readable, and consistent with nearby code.

Use these naming conventions unless the surrounding module clearly establishes a different local rule:

- `snake_case` for variables and many local values where the project already does this.
- `camelCase` for functions.
- `PascalCase` for classes, components, and types.

Type-system rules:

- Avoid `any`; use concrete types or `unknown` with narrowing.
- Use `import type` for type-only imports.
- Reuse existing types with `Pick`, `Omit`, `Partial`, and other utility types before inventing duplicates.
- Prefer literal unions over `enum` unless there is a strong reason not to.

File-organization rules:

- Keep local types in nearby `types.ts` when they are module-specific.
- Keep cross-package shared contracts in the shared layer rather than duplicating them.

Style rules:

- Add blank lines between logically different steps.
- Prefer readable destructuring and straightforward control flow.
- Let types be explicit where they improve API clarity or complex inference, but do not add noise just to annotate the obvious.
