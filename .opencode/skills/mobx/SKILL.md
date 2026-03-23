---
name: mobx
description: Guides state management implementation using MobX + tsyringe. Triggered when handling data models, state logic, or Store architecture.
---

# MobX State Management Guide

This skill provides mandatory specifications for using MobX and tsyringe (for dependency injection DI) for state management in this project.

## 1. Architecture Overview

- **MobX**: Core state management library (using `makeAutoObservable`).
- **tsyringe**: Dependency injection container for models.
- **Modular Models**: State is split into specialized models (e.g., `GlobalModel`, `Settings`).
- **Auto-binding**: Actions are automatically bound to class instances.

## 2. Model Implementation Patterns

### 2.1 Basic Model Structure

```typescript
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export default class FeatureModel {
	count = 0
	loading = false

	constructor() {
		// ✅ Use autoBind: true for convenient event handling
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

### 2.2 Singleton Model (Root Store)

```typescript
import { singleton } from 'tsyringe'

import { Settings } from '@/models'

@singleton()
export default class GlobalModel {
	// ✅ Dependency injection via constructor
	constructor(public settings: Settings) {}

	init() {
		this.settings.init()
	}

	off() {
		this.settings.off()
	}
}
```

### 2.3 Handling Complex Models (DI Composition)

For complex state management (more than 20 reactive variables), models should be split into smaller, focused sub-models and composed using DI.

```typescript
// ✅ Recommended: split complex models into multiple sub-models and inject
@injectable()
export default class ComplexFeatureModel {
	constructor(
		public data: DataSubModel,
		public ui: UISubModel,
		public sync: SyncSubModel,
		public util: Util
	) {
		// Note: exclude injected dependencies, don't make them observable
		makeAutoObservable(this, { data: false, ui: false, sync: false, util: false }, { autoBind: true })
	}
}
```

## 3. Parent-Child Model Communication

### 3.1 Accessing Singleton GlobalModel

In sub-models, you can declare a non-observable property and bind the singleton `GlobalModel` instance in the constructor using the `getGlobal` utility function.

```typescript
import { injectable } from 'tsyringe'

import { getGlobal } from '@/utils'

import type { GlobalModel } from '@/models'

@injectable()
export default class SubModel {
	// ✅ Declare as non-reactive property
	global = null as unknown as GlobalModel

	constructor() {
		makeAutoObservable(this, { global: false }, { autoBind: true })

		// ✅ Bind instance via utility function
		getGlobal(this.global)
	}
}
```

### 3.2 Accessing Parent in Transient Models

In non-singleton models, `container.resolve()` creates new instances. To ensure sub-models access the correct parent instance, the parent must explicitly pass its reference.

**Key Principles:**

1. **Avoid Recursive Injection**: Never call `container.resolve(ParentModel)` inside the constructor of a sub-model that the parent model depends on.
2. **Active Assignment**: The parent model is responsible for establishing the association reference.

## 4. Lifecycle Management

All models should implement `init()` and `off()` methods for initialization setup and destruction cleanup.

```typescript
@injectable()
export default class Index {
	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		// ✅ Collect cleanup functions (disposers) into util.acts array
		this.util.acts = [
			/* ... */
		]
	}

	off() {
		// ✅ Execute cleanup logic
		this.util.off()
	}
}
```

## 5. Constraints and Best Practices

### 5.1 Observable Rules

- **Reactive State**: Define all reactive state as class properties.
- **Exclusions**: Use the second parameter of `makeAutoObservable` to exclude injected services/util classes (set to `false`), preventing them from becoming reactive.

### 5.2 Dependency Injection (tsyringe)

- **@injectable()**: For feature models that can be instantiated multiple times or locally injected.
- **@singleton()**: For global stores that should only have one instance.
- **Constructor Injection**: Always prefer constructor injection, and use the `public` keyword to automatically assign properties.

### 5.3 Code Style

- **No Comments**: Don't write explanatory comments in model files.
- **snake_case**: All reactive state variable names must use snake_case.
- **camelCase**: All methods must use camelCase.
- **PascalCase**: All class names must use PascalCase.
- **AutoBind**: Always use `{ autoBind: true }` in `makeAutoObservable`.

### 5.4 Common Errors

- Forgetting the `@injectable` decorator will cause DI failure.
- Forgetting to clean up reactions in `off()` will cause memory leaks.
- Constructors should not be too heavy; time-consuming initialization logic must be placed in `init()`.
