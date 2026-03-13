---
name: mobx
description: 指导使用 MobX + tsyringe 实现状态管理。在处理数据模型、状态逻辑或 Store 架构时触发。
---

# MobX 状态管理指南

此技能提供了在项目中强制使用 MobX 以及 tsyringe（用于依赖注入 DI）进行状态管理的规范。

## 1. 架构概览

- **MobX**: 核心状态管理库 (使用 `makeAutoObservable`)。
- **tsyringe**: 用于模型的依赖注入容器。
- **模块化模型**: 状态被拆分为专门的模型（如 `GlobalModel`, `Settings`）。
- **自动绑定**: 动作 (actions) 会被自动绑定到类实例上。

## 2. 模型实现模式

### 2.1 基础模型结构

```typescript
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

@injectable()
export default class FeatureModel {
	count = 0
	loading = false

	constructor() {
		// ✅ 使用 autoBind: true 以方便事件处理
		makeAutoObservable(this, {}, { autoBind: true })
	}

	increment() {
		this.count++
	}

	async fetchData() {
		this.loading = true
		try {
			// API 调用逻辑
		} finally {
			this.loading = false
		}
	}
}
```

### 2.2 单例模型 (根 Store)

```typescript
import { singleton } from 'tsyringe'

import { Settings } from '@/models'

@singleton()
export default class GlobalModel {
	// ✅ 通过构造函数进行依赖注入
	constructor(public settings: Settings) {}

	init() {
		this.settings.init()
	}

	off() {
		this.settings.off()
	}
}
```

### 2.3 处理复杂模型 (DI 组合)

对于复杂的状态管理（超过 20 个响应式变量），应将模型拆分为更小、更专注的子模型，并使用 DI 组合它们。

```typescript
// ✅ 推荐：将复杂的模型拆分为多个子模型并注入
@injectable()
export default class ComplexFeatureModel {
	constructor(
		public data: DataSubModel,
		public ui: UISubModel,
		public sync: SyncSubModel,
		public util: Util
	) {
		// 注意：排除注入的依赖，不要将其变为 observable
		makeAutoObservable(this, { data: false, ui: false, sync: false, util: false }, { autoBind: true })
	}
}
```

## 3. 父子模型通信

### 3.1 访问单例 GlobalModel

在子模型中，可以通过声明一个非 observable 的属性，并在构造函数中使用 `getGlobal` 工具函数绑定 `GlobalModel` 的单例。

```typescript
import { injectable } from 'tsyringe'

import { getGlobal } from '@/utils'

import type { GlobalModel } from '@/models'

@injectable()
export default class SubModel {
	// ✅ 声明为非响应式属性
	global = null as unknown as GlobalModel

	constructor() {
		makeAutoObservable(this, { global: false }, { autoBind: true })

		// ✅ 通过工具函数绑定实例
		getGlobal(this.global)
	}
}
```

### 3.2 在临时 (Transient) 模型中访问父级

在非单例模型中，`container.resolve()` 会创建新实例。为了确保子模型访问到正确的父级实例，父级必须显式传递其引用。

**关键原则：**

1. **避免递归注入**：永远不要在依赖子模型的父级模型对应的子模型构造函数内，调用 `container.resolve(ParentModel)`。
2. **主动赋值**：由父模型负责建立关联引用。

## 4. 生命周期管理

所有模型都应实现 `init()` 和 `off()` 方法用于初始化设置和销毁清理。

```typescript
@injectable()
export default class Index {
	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		// ✅ 收集清理函数 (disposers) 到 util.acts 数组中
		this.util.acts = [
			/* ... */
		]
	}

	off() {
		// ✅ 执行清理逻辑
		this.util.off()
	}
}
```

## 5. 约束与最佳实践

### 5.1 Observable 规则

- **响应式状态**：将所有响应式状态定义为类属性。
- **排除项 (Exclusions)**：使用 `makeAutoObservable` 的第二个参数，将注入的服务/工具类排除掉（设为 `false`），不让它们变成响应式。

### 5.2 依赖注入 (tsyringe)

- **@injectable()**：用于可多次实例化或局部注入的特性模型。
- **@singleton()**：用于只应存在一个实例的全局 Store。
- **构造器注入**：永远优先使用构造函数注入，并且使用 `public` 关键字自动赋值属性。

### 5.3 代码风格

- **禁止注释**：不要在模型文件中写解释性注释。
- **snake_case**：所有响应式状态变量名必须使用蛇形命名。
- **camelCase**：所有方法必须使用驼峰命名。
- **PascalCase**：所有类名必须使用帕斯卡命名。
- **AutoBind**：始终在 `makeAutoObservable` 中使用 `{ autoBind: true }`。

### 5.4 常见错误

- 忘记加 `@injectable` 装饰器会导致 DI 失败。
- 忘记在 `off()` 中清理 reaction 会导致内存泄漏。
- 构造函数不能太重；耗时的初始化逻辑必须放入 `init()`。
