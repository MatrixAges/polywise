---
name: typescript
description: Guides the implementation of TypeScript in the project, including naming conventions, type definitions, and code style. Triggered when writing or refactoring TypeScript code.
---

# TypeScript Development Skill

This skill provides mandatory instructions for writing TypeScript in this project, ensuring consistency, type safety, and clean code.

## 1. Naming Conventions

### 1.1 Variables and Functions

- **Variables**: Use `snake_case` (e.g., `theme_value`, `is_dev`).
- **Functions**: Use `camelCase` (e.g., `getAntdTheme`, `setGlobalAnimation`).
- **Internal Props Objects**: Use `props_*` prefix (e.g., `props_side_bar`).

### 1.2 Classes and Types

- **Classes**: Use `PascalCase` (e.g., `GlobalModel`, `Settings`).
- **Interfaces/Types**: Use `PascalCase`. Interfaces should ideally start with `I` (e.g., `IProps`, `IPropsSidebar`).
- **Enum-like Types**: Use literal unions instead of `enum` whenever possible (e.g., `type Theme = 'light' | 'dark' | 'system'`).

## 2. Type Definitions

### 2.1 File Organization

- **Global Types**: Place in `packages/app/types/` or `packages/app/typings/`.
- **Local Types**: Use a `types.ts` file within the same directory as the component or module.
- **Props**: Define an `IProps` interface for each component, typically in the component file or an adjacent `types.ts`.

### 2.2 Best Practices

- **Explicit Types**: Favor explicit type annotations for function parameters and complex return types.
- **Utility Types**: Leverage TypeScript's utility types (`Pick`, `Omit`, `Partial`, `Exclude`) to reuse existing definitions.
- **Strict Typing**: Avoid `any`. Use `unknown` if the type is truly unknown and cast when necessary.
- **Type Aliases vs. Interfaces**: Use `interface` for object structures (especially props) and `type` for unions, intersections, or primitives.

## 3. Code Style

### 3.1 Imports and Exports

- **Named Exports**: Prefer named exports for utilities and models.
- **Default Exports**: Use default exports for the main component or the primary class in a file.
- **Type-only Imports**: Use `import type` for importing types to maintain clean process boundaries and reduce bundle size.
- **Path Aliases**: Use `@/` to refer to the `src` directory (e.g., `import { Settings } from '@/models'`).

### 3.2 Statements and Logic

- **Arrow Functions**: Prefer arrow functions for component definitions and small utility functions.
- **Destructuring**: Use destructuring for props and objects to improve readability.
- **Conditional Logic**: Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access.

## 4. Implementation Examples

### 4.1 Interface with Pick and Exclude

```typescript
import { Settings } from '@/models'

import type { Theme } from '@/types'

export interface IPropsSidebar extends Pick<Settings, 'toggleSidebar' | 'toggleSettings'> {
	fold: Settings['sidebar_fold']
	current_theme: Exclude<Theme, 'system'>
}
```

### 4.2 Utility with Strict Typing

```typescript
export const capitalizeFirst = (str: string): string => {
	if (!str) return ''
	return str.charAt(0).toUpperCase() + str.slice(1)
}
```

### 4.3 Type-safe Union

```typescript
export type Theme = 'light' | 'dark' | 'system'
export type ThemeValue = Exclude<Theme, 'system'>

export interface IThemeConfig {
	value: ThemeValue
	is_auto: boolean
}
```

## 5. Summary Checklist

- [ ] Are variable names in `snake_case`?
- [ ] Are function names in `camelCase`?
- [ ] Are component props using `IProps` or `IProps*`?
- [ ] Is `import type` used for type-only imports?
- [ ] Are local types placed in a `types.ts` file?
- [ ] Is `any` avoided in favor of strict typing or `unknown`?
