---
name: mobx
description: Guides the implementation of state management using MobX + tsyringe. Triggered when working on data models, state logic, or store architecture.
---

# MobX State Management Skill

This skill provides mandatory instructions for implementing state management using MobX and tsyringe for Dependency Injection (DI) in this project.

## 1. Architecture Overview

The project uses a structured approach to state management:

- **MobX**: Core state management library (using `makeAutoObservable`)
- **tsyringe**: Dependency injection container for models
- **Modular Models**: State is divided into specialized models (e.g., `GlobalModel`, `Settings`)
- **Automatic Binding**: Actions are automatically bound to the class instance

## 2. Directory Structure

```
packages/app/
├── models/
│   ├── index.ts                # Model exports
│   ├── Global.ts               # Root singleton model
│   ├── Settings.ts             # Specialized injectable model
│   └── common/
│       ├── index.ts
│       └── Util.ts             # Common utility model (loading, disposers)
```

## 3. Model Implementation Patterns

### 3.1 Basic Model Structure

```typescript
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export default class FeatureModel {
	count = 0
	loading = false

	constructor() {
		// ✅ Use autoBind: true for easier event handling
		makeAutoObservable(this, {}, { autoBind: true })
	}

	increment() {
		this.count++
	}

	async fetchData() {
		this.loading = true
		try {
			// API call logic
		} finally {
			this.loading = false
		}
	}
}
```

### 3.2 Singleton Model (Root Store)

```typescript
import { singleton } from 'tsyringe'
import { Settings } from '@/models'

@singleton()
export default class GlobalModel {
	// ✅ Dependency Injection via constructor
	constructor(public settings: Settings) {}

	init() {
		this.settings.init()
	}

	off() {
		this.settings.off()
	}
}
```

### 3.3 Handling Complex Models (DI Composition)

For complex state management (exceeding 20 observable variables), split the model into smaller, specialized models and compose them using DI.

```typescript
// ✅ Good: Split complex model into sub-models
@injectable()
export default class ComplexFeatureModel {
	constructor(
		public data: DataSubModel,
		public ui: UISubModel,
		public sync: SyncSubModel,
		public util: Util
	) {
		makeAutoObservable(this, { data: false, ui: false, sync: false, util: false }, { autoBind: true })
	}
}
```

## 4. Lifecycle Management

Models should implement `init()` and `off()` methods for setup and cleanup.

```typescript
@injectable()
export default class Index {
	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		// ✅ Store synchronization using stk utilities
		const off = await setStoreWhenChange(['lang', 'theme_source'], this)

		// ✅ Collect disposers in util.acts
		this.util.acts = [off]
	}

	off() {
		// ✅ Implementation of cleanup logic
		this.util.off()
	}
}
```

## 5. Integration with React

### 5.1 Provider Setup

```typescript
// context/global.ts
import { createContext, useContext } from 'react'

import Model from '../models/Global'

const GlobalContext = createContext<Model>()
export const GlobalProvider = GlobalContext.Provider
export const useGlobal = () => useContext(GlobalContext)
```

### 5.2 Component Usage

```typescript
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context'

const MyComponent = observer(() => {
	const { settings } = useGlobal()

	return (
		<div onClick={settings.toggleSidebar}>
			{settings.sidebar_fold ? 'Folded' : 'Open'}
		</div>
	)
})
```

## 6. Utilities from `stk/mobx`

The project uses shared utilities for common MobX patterns.

- `setStoreWhenChange`: Sync class properties with local storage/config
- `setStorageWhenChange`: Reactively update storage when properties change
- `useInstanceWatch`: React hook to watch MobX instance properties
- `copy`: Deep copy utility for MobX objects

## 7. Constraints & Best Practices

### 7.1 Observable Rules

- **Observable State**: Define all reactive state as class properties
- **Actions**: Define all state-modifying logic as class methods
- **Computed**: Use getters for derived state (MobX automatically treats them as `computed`)
- **Exclusions**: Use the second argument of `makeAutoObservable` to exclude non-observable properties (like injected services/utils)

### 7.2 Dependency Injection (tsyringe)

- **@injectable()**: Use for feature models that can be instantiated multiple times or injected
- **@singleton()**: Use for global stores that should have only one instance
- **Constructor Injection**: ALWAYS prefer constructor injection over property injection
- **Access Modifiers**: Use `public` in constructor to automatically assign properties

### 7.3 Code Style

- **No Comments**: DO NOT add comments to model files
- **snake_case**: Use snake_case for observable variable names
- **camelCase**: Use camelCase for methods
- **PascalCase**: Use PascalCase for Class names
- **AutoBind**: ALWAYS use `{ autoBind: true }` in `makeAutoObservable`

### 7.4 Performance

- **Granular Updates**: Keep models focused to minimize unnecessary re-renders
- **Reaction Management**: ALWAYS dispose of reactions/subscriptions in the `off()` method
- **Loading States**: Use a dedicated `Util` model or property to track async operation status

## 8. Implementation Examples

### 8.1 Complex State Splitting (Few-Shot)

```typescript
// Sub-model for Data
@injectable()
class ChatDataModel {
	messages = []
	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}
}

// Sub-model for UI state
@injectable()
class ChatUIModel {
	is_typing = false
	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}
}

// Main Model composition
@injectable()
export default class ChatModel {
	constructor(
		public data: ChatDataModel,
		public ui: ChatUIModel
	) {
		makeAutoObservable(this, { data: false, ui: false }, { autoBind: true })
	}
}
```

### 8.2 Using stk Utilities

```typescript
import { setStoreWhenChange } from 'stk/mobx'

@injectable()
export default class UserSettings {
	theme = 'light'

	async init() {
		// Sync 'theme' property with storage automatically
		const disposer = await setStoreWhenChange(['theme'], this)
		this.util.acts.push(disposer)
	}
}
```

## 9. Common Mistakes to Avoid

- **Direct State Mutation**: Never mutate state outside of an action (though MobX 6+ allows it if not in strict mode, it's bad practice)
- **Missing @injectable**: Forgetting to decorate a class will cause DI to fail
- **Infinite Loops**: Be careful with `reaction` or `autorun` that modifies the observed state
- **Memory Leaks**: Forgetting to call `.off()` or clear disposers when a model is no longer needed
- **Complex Constructors**: Keep constructors simple; move heavy initialization logic to an `init()` method

## 10. Summary of Architectural Rules

1. **Hierarchy**: GlobalModel (Singleton) -> FeatureModels (Injectable) -> SubModels
2. **Communication**: Sub-models communicate via the parent model or shared services
3. **Purity**: Models should contain logic and data, not UI or DOM manipulation
4. **Composition**: Favor DI composition over inheritance for complex models
5. **Consistency**: Follow the established `init()`/`off()` lifecycle pattern everywhere
