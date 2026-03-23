---
name: typescript
description: Guide for implementing TypeScript in projects, including naming conventions, type definitions, and code style. Triggered when writing or refactoring TypeScript code.
---

# TypeScript Development Guide

This skill provides mandatory specifications for writing TypeScript in this project to ensure consistency, type safety, and code cleanliness.

## 1. Naming Conventions

### 1.1 Variables and Functions

- **Variables**: Use `snake_case` (e.g., `theme_value`, `is_dev`).
- **Functions**: Use `camelCase` (e.g., `getAntdTheme`, `setGlobalAnimation`).
- **Internal Props Objects**: Use `props_*` prefix (e.g., `props_side_bar`).

### 1.2 Classes and Types

- **Classes**: Use `PascalCase` (e.g., `GlobalModel`, `Settings`).
- **Interfaces/Types**: Use `PascalCase`. Interfaces preferably start with `I` (e.g., `IProps`, `IPropsSidebar`).
- **Enum-like Types**: Use literal union types instead of `enum` where possible (e.g., `type Theme = 'light' | 'dark' | 'system'`).

## 2. Type Definitions

### 2.1 File Organization

- **Global Types**: Place in `packages/app/types/` or `packages/app/typings/`.
- **Local Types**: Use `types.ts` file in the component or module directory.
- **Props**: Define an `IProps` interface for each component, typically in the component file or adjacent `types.ts`.

### 2.2 Best Practices

- **Explicit Types**: Prefer providing explicit type annotations for function parameters and complex return value types.
- **Utility Types**: Leverage TypeScript's utility types (`Pick`, `Omit`, `Partial`, `Exclude`) to reuse existing definitions.
- **Strict Types**: Avoid `any`. If the type is truly unknown, use `unknown` and perform type casting (cast) when necessary.
- **Type Alias vs. Interface**: Use `interface` for object structures (especially props), use `type` for unions, intersections, or base types.

## 3. Code Style

### 3.1 Imports and Exports

- **Named Exports**: Utility functions and models prefer named exports.
- **Default Exports**: For the main component or main class in a file, use default export.
- **Pure Type Imports**: Use `import type` for importing types to maintain clear process boundaries and reduce bundle size.
- **Path Aliases**: Use `@/` to reference the `src` directory (e.g., `import { Settings } from '@/models'`).

### 3.2 Statements and Logic

- **Arrow Functions**: Component definitions and small utility functions prefer arrow functions.
- **Destructuring**: Use destructuring for props and objects to improve readability.
- **Conditional Logic**: Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access.

### 3.3 Code Spacing and Blank Lines

Use blank lines to separate code with different execution styles or visual appearances. **If two adjacent lines of code look stylistically different, a blank line must be added between them.**

**When to Add Blank Lines:**

- Between data fetching and return statements
- Between variable calculation and usage
- Between multiple consecutive operations (different independent steps)
- Before early returns
- Between different operation types (sync vs async, query vs mutation)
- Before and after state changes

**Recommended:**

```typescript
async getSnapshot(weight_threshold = 0.2) {
	const nodes = await this.query(sql.sql_get_snapshot_nodes(weight_threshold))
	const edges = await this.query(sql.sql_get_snapshot_edges(weight_threshold))

	return { nodes, edges }
}

async tick(threshold_override?: number) {
	const threshold = threshold_override ?? 0.5

	await this.exec(sql.sql_tick(threshold))
}
```

**Avoid:**

```typescript
async getSnapshot(weight_threshold = 0.2) {
	const nodes = await this.query(sql.sql_get_snapshot_nodes(weight_threshold))
	const edges = await this.query(sql.sql_get_snapshot_edges(weight_threshold))
	return { nodes, edges }
}
```

## 4. Summary Checklist

- [ ] Are variable names `snake_case`?
- [ ] Are function names `camelCase`?
- [ ] Are component props using `IProps` or `IProps*`?
- [ ] Are pure type imports using `import type`?
- [ ] Are local types placed in `types.ts` files?
- [ ] Has `any` been avoided in favor of strict types or `unknown`?
- [ ] Are blank lines used to separate different execution style code blocks?
