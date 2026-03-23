---
name: react
description: Guides React component implementation, performance optimization, and state management thresholds. Triggered when handling components, pages, or UI logic.
---

# React Development Guide

This skill provides a comprehensive guide for building React components in the project, focusing on performance, state management thresholds, and modular organization.

## 1. Component Architecture

### 1.1 Standard Component Pattern

Every component should follow the standard export pattern to ensure responsiveness (MobX) and performance (Memoization).

```typescript
import { observer } from 'mobx-react-lite'

const Index = (props: IProps) => {
	const { data } = props

	return (
		<div className='flex flex-col p-4'>
			{/* Content */}
		</div>
	)
}

// ✅ Mandatory: For components needing state responsiveness or performance optimization, use $app.handle wrapper
export default new $app.handle(Index).by(observer).by($app.memo).get()

// ✅ Optional: For simple presentational components, directly use $app.memo
export default $app.memo(Index)
```

### 1.2 Module Splitting (Fractal Architecture)

Large modules must be split according to fractal patterns to maintain high maintainability and clear scope.

- **Local Components**: Use `components/` folder within the module directory. Component names should be concise (e.g., `Item.tsx`, `Header.tsx`).
- **Loop Extraction**: Components rendered in loops (e.g., content inside `.map()`) must be extracted to separate component files to optimize diff rendering performance.
- **File Organization**:
     ```
     module/
     ├── index.tsx                # Entry and layout
     ├── types.ts                 # Local type definitions
     ├── components/              # Local sub-components
     │   ├── List.tsx
     │   ├── Item.tsx             # Loop item component extraction
     │   └── index.ts             # Internal unified export
     ├── models/                  # (Optional) Local MobX models
     │   └── Local.ts
     └── styles/                  # (Optional) CSS Modules
         └── index.module.css
     ```

### 1.3 Props Management Pattern

To maintain component cleanliness and reference stability, follow these patterns for declaring and passing Props:

- **Performance-sensitive Props**: For props that trigger heavy operations (e.g., Ant Design theme configuration, large data trees), use `useMemo`.
- **Standard Props**: If they don't trigger expensive re-renders, simple objects can be declared directly.
- **Naming**: Always use `props_*` prefix as the naming convention for internal props objects.

## 2. Performance Optimization

### 2.1 Function Reference Management

To prevent unnecessary re-renders of child components, all functions (event handlers, callbacks) must have stable references.

```typescript
import { useMemoizedFn } from 'ahooks'

// ✅ Mandatory: wrap all component-internal functions with useMemoizedFn
const handleClick = useMemoizedFn(() => {
	// Logic handling
})

// ✅ Pass stable references to child components
<Child onClick={handleClick} />
```

### 2.2 Props Comparison Optimization

`$app.memo` performs deep comparison. To cooperate with its work and avoid unnecessary checks on heavy objects:

- **Reference Type Values**: For non-primitive data type props (objects, arrays), use global `$copy(value)` to pass value-based copies.
- **Principle**: Using `$copy` ensures that even if the parent component re-renders and creates new object references, as long as the data content hasn't changed, the child component won't re-render.

```typescript
// ✅ Mandatory: pass non-primitive data types through $copy
<LargeComponent
	config={$copy(config_object)}
	items={$copy(data_array)}
/>
```

### 2.3 Conditional Style Classes

Use the global `$cx` (classix) utility for efficient, readable conditional CSS class merging.

```typescript
<div
	className={$cx(
		'base-class',
		isActive && 'active-class',
		isError ? 'text-red' : 'text-gray'
	)}
/>
```

## 3. State Management Thresholds

### 3.1 State Hierarchy

1. **Shared State**: Managed by top-level models (e.g., `GlobalModel`), injected via `tsyringe`, obtained using `useGlobal`.
2. **Simple Component State**: If reactive variables/logic blocks are **less than or equal to 4**, manage with standard Hooks (`useState`, `useMemo`).
3. **Complex Component State**: If a component's internal logic exceeds **4 reactive variables**, you must create a standalone MobX model (Local Model) coexisting with that component.

### 3.2 Local Model Implementation

Local models also use `tsyringe` dependency injection.

```typescript
// module/models/Local.ts
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export class LocalModel {
	v1 = ''
	v2 = 0
	v3 = []
	v4 = false
	v5 = {} // 5th variable, triggers mandatory Model usage rule

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	action() { /* ... */ }
}

// module/index.tsx
const Index = () => {
	const [local] = useState(() => container.resolve(LocalModel))

	return <div onClick={local.action}>{local.v1}</div>
}
```

## 4. Summary Checklist

- [ ] Are components exported via `$app.handle` or `$app.memo`?
- [ ] Are all component-internal functions wrapped with `useMemoizedFn`?
- [ ] Are large object/array props passed using `$copy`?
- [ ] Are loop-rendered list items extracted to separate component files?
- [ ] Do local component state variables exceed 4? (If yes, transfer to MobX Model)
- [ ] Does the directory structure follow fractal patterns?
