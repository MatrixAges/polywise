---
name: react
description: 指导 React 组件的实现、性能优化以及状态管理阈值。在处理组件、页面或 UI 逻辑时触发。
---

# React 开发指南

此技能提供了在项目中构建 React 组件的全面指南，重点关注性能、状态管理阈值和模块化组织。

## 1. 组件架构

### 1.1 标准组件模式

每个组件都应遵循标准导出模式，以确保响应性 (MobX) 和性能 (Memoization)。

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

// ✅ 强制要求：对于需要状态响应或性能优化的组件，使用 $app.handle 包装器
export default new $app.handle(Index).by(observer).by($app.memo).get()

// ✅ 可选：对于简单的展示组件，直接使用 $app.memo
export default $app.memo(Index)
```

### 1.2 模块拆分 (分形架构)

大型模块必须按照分形模式进行拆分，以保持高可维护性和清晰的作用域。

- **局部组件**：在模块目录内使用 `components/` 文件夹。组件名称应简明扼要（例如：`Item.tsx`, `Header.tsx`）。
- **循环抽取**：在循环中渲染的组件（例如 `.map()` 内的内容）必须抽取到单独的组件文件中，以优化 diff 渲染性能。
- **文件组织**：
     ```
     module/
     ├── index.tsx                # 入口和布局
     ├── types.ts                 # 局部类型定义
     ├── components/              # 局部子组件
     │   ├── List.tsx
     │   ├── Item.tsx             # 循环项组件抽取
     │   └── index.ts             # 内部统一导出
     ├── models/                  # (可选) 局部 MobX 模型
     │   └── Local.ts
     └── styles/                  # (可选) CSS Modules
         └── index.module.css
     ```

### 1.3 Props 管理模式

为了保持组件的整洁和引用稳定，请遵循以下声明和传递 Props 的模式：

- **性能敏感的 Props**：对于触发繁重操作（例如 Ant Design 的主题配置、大型数据树）的 props，请使用 `useMemo`。
- **标准 Props**：如果不触发昂贵的重新渲染，可以直接声明简单对象。
- **命名**：始终使用 `props_*` 前缀作为内部 props 对象的命名规范。

## 2. 性能优化

### 2.1 函数引用管理

为了防止子组件发生不必要的重新渲染，所有函数（事件处理程序、回调）必须具备稳定的引用。

```typescript
import { useMemoizedFn } from 'ahooks'

// ✅ 强制要求：使用 useMemoizedFn 包装所有组件内部定义的函数
const handleClick = useMemoizedFn(() => {
	// 逻辑处理
})

// ✅ 将稳定的引用传递给子组件
<Child onClick={handleClick} />
```

### 2.2 Props 对比优化

`$app.memo` 会进行深度比较。为了配合其工作并避免对重型对象进行不必要的检查：

- **引用类型值**：对于非基本数据类型的 props（对象、数组），使用全局的 `$copy(value)` 传递基于值的拷贝。
- **原理**：使用 `$copy` 可以确保即使父组件重新渲染并创建了新的对象引用，只要数据内容没变，子组件就不会重新渲染。

```typescript
// ✅ 强制要求：通过 $copy 传递非基础数据类型
<LargeComponent
	config={$copy(config_object)}
	items={$copy(data_array)}
/>
```

### 2.3 条件样式类名

使用全局的 `$cx` (classix) 工具进行高效、易读的条件 CSS 类合并。

```typescript
<div
	className={$cx(
		'base-class',
		isActive && 'active-class',
		isError ? 'text-red' : 'text-gray'
	)}
/>
```

## 3. 状态管理阈值

### 3.1 状态层级

1. **共享状态**：由顶层模型（如 `GlobalModel`）管理，通过 `tsyringe` 注入，使用 `useGlobal` 获取。
2. **简单的组件状态**：如果响应式变量/逻辑块 **小于等于 4 个**，使用标准 Hook（`useState`, `useMemo`）管理。
3. **复杂的组件状态**：如果一个组件的内部逻辑超过 **4 个响应式变量**，你必须创建一个与该组件共存的独立 MobX 模型（Local Model）。

### 3.2 局部模型 (Local Model) 的实现

局部模型也要使用 `tsyringe` 依赖注入。

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
	v5 = {} // 第5个变量，触发强制使用 Model 的规则

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

## 4. 总结检查清单

- [ ] 组件是否通过 `$app.handle` 或 `$app.memo` 导出？
- [ ] 所有的组件内部函数是否都用 `useMemoizedFn` 包裹？
- [ ] 庞大的对象/数组 props 是否使用了 `$copy` 进行传递？
- [ ] 循环渲染的列表项是否被抽离为独立的组件文件？
- [ ] 局部组件状态变量是否超过了 4 个？（如是，请转移到 MobX Model 中）
- [ ] 目录结构是否遵循了分形模式？
