---
name: react
description: Guides the implementation of React components, performance optimization, and state management thresholds. Triggered when working on components, pages, or UI logic.
---

# React Development Skill

This skill provides comprehensive instructions for building React components in the Polywise project, focusing on performance, state management thresholds, and modular organization.

## 1. Component Architecture

### 1.1 Standard Component Pattern

Every component should follow the standard export pattern to ensure reactivity (MobX) and performance (Memoization).

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

// ✅ Mandatory: Use the $app.handle wrapper for components requiring state/memoization
export default new $app.handle(Index).by(observer).by($app.memo).get()

// ✅ Optional: For simple presentation components, use $app.memo directly
export default $app.memo(Index)
```

### 1.2 Modular Splitting (Fractal Architecture)

Large modules must be split following a fractal pattern to maintain high maintainability and clear scoping.

- **Local Components**: Use a `components/` folder within the module directory. Component names should be concise (e.g., `Item.tsx`, `Header.tsx`).
- **Loop Extraction**: Components rendered inside a loop (e.g., `.map()`) MUST be extracted into a separate component file to optimize reconciliation.
- **File Organization**:
     ```
     module/
     ├── index.tsx                # Entry and layout
     ├── types.ts                 # Local type definitions
     ├── components/              # Scoped sub-components
     │   ├── List.tsx
     │   ├── Item.tsx             # Loop item extraction
     │   └── index.ts             # Internal exports
     ├── models/                  # (Optional) Local MobX models
     │   └── Local.ts
     └── styles/                  # (Optional) CSS Modules
         └── index.module.css
     ```

### 1.3 Props Management Patterns

To keep components clean and maintain stable references, follow this pattern for declaring and passing props:

- **Performance-Critical Props**: Use `useMemo` for props that trigger heavy operations (e.g., Ant Design's `ConfigProvider` theme, large data trees).
- **Standard Props**: Directly declare simple objects if they don't trigger expensive re-renders or the sub-component is highly optimized.
- **Naming**: Always use the `props_*` prefix for internal prop objects.

```typescript
const Index = () => {
	// ✅ Mandatory for performance-heavy components
	const props_config_provider: ConfigProviderProps = useMemo(() => ({
		prefixCls: 'pw',
		theme: getAntdTheme(settings.theme_value) // Expensive operation
	}), [settings.theme_value])

	// ✅ Standard declaration for simple props
	const props_tab: IPropsTab = {
		active: true
	}

	return (
		<>
			<ConfigProvider {...props_config_provider}>
				<Tab {...props_tab} />
			</ConfigProvider>
		</>
	)
}
```

## 2. Performance Optimization

### 2.1 Function Reference Management

To prevent unnecessary re-renders in children components, all functions (event handlers, callbacks) MUST have stable references.

```typescript
import { useMemoizedFn } from 'ahooks'

// ✅ Mandatory: Wrap ALL component functions with useMemoizedFn
const handleClick = useMemoizedFn(() => {
	// Logic
})

// ✅ Pass stable references to children
<Child onClick={handleClick} />
```

### 2.2 Prop Comparison Optimization

`$app.memo` performs deep comparison. To facilitate this and avoid unnecessary checks on heavy objects:

- **Reference Values**: For non-primitive props (objects, arrays), use the global `$copy(value)` to pass a value-based representation.
- **Value vs. Reference**: `$app.memo` is optimized to compare values. By using `$copy`, you ensure that even if a parent re-renders and creates a new object reference, the child only re-renders if the data content actually changed.

```typescript
// ✅ Mandatory: Pass non-primitive data via $copy
<LargeComponent
	config={$copy(config_object)}
	items={$copy(data_array)}
/>
```

### 2.3 Conditional Classes

Use the global `$cx` (classix) utility for efficient and readable conditional class merging.

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

### 3.1 Hierarchy of State

1. **Shared State**: Managed by top-level models (e.g., `GlobalModel`) injected via `tsyringe` and accessed via `useGlobal`.
2. **Simple Component State**: Managed via standard hooks (`useState`, `useMemo`) IF there are **4 or fewer** reactive variables/logic pieces.
3. **Complex Component State**: If a component's internal logic exceeds **4 reactive variables**, you MUST create a dedicated MobX model co-located with the component.

### 3.2 Local Model Implementation

Use `tsyringe` for local models to maintain consistency with the global dependency injection pattern.

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
	v5 = {} // 5th variable triggers the Model rule

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

## 4. Code Splitting & Loading

### 4.1 Dynamic Imports

Use dynamic `import()` for large dependencies or locale files to reduce the initial bundle size.

```typescript
// Example: Dynamic locale loading
import(`@/locales/${lang}/index`).then(data => {
	// Use data
})
```

## 5. Summary Checklist for Developers

- [ ] Is the component exported via `$app.handle` or `$app.memo`?
- [ ] Are all functions wrapped with `useMemoizedFn`?
- [ ] Are heavy object/array props passed using `$copy`?
- [ ] Are loop items extracted into separate components?
- [ ] Does the component have >4 state variables? (If yes, move to a Model)
- [ ] Is the directory structure following the fractal pattern?
