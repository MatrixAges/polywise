---
name: typescript
description: 在项目中实现 TypeScript 的指南，包括命名规范、类型定义和代码风格。在编写或重构 TypeScript 代码时触发。
---

# TypeScript 开发指南

此技能提供了在本项目中编写 TypeScript 的强制性规范，以确保一致性、类型安全和代码整洁。

## 1. 命名规范

### 1.1 变量与函数

- **变量**：使用 `snake_case`（例如：`theme_value`, `is_dev`）。
- **函数**：使用 `camelCase`（例如：`getAntdTheme`, `setGlobalAnimation`）。
- **内部 Props 对象**：使用 `props_*` 前缀（例如：`props_side_bar`）。

### 1.2 类与类型

- **类**：使用 `PascalCase`（例如：`GlobalModel`, `Settings`）。
- **接口/类型**：使用 `PascalCase`。接口最好以 `I` 开头（例如：`IProps`, `IPropsSidebar`）。
- **类似枚举的类型**：尽可能使用字面量联合类型代替 `enum`（例如：`type Theme = 'light' | 'dark' | 'system'`）。

## 2. 类型定义

### 2.1 文件组织

- **全局类型**：放置在 `packages/app/types/` 或 `packages/app/typings/` 中。
- **局部类型**：在组件或模块所在目录使用 `types.ts` 文件。
- **Props**：为每个组件定义一个 `IProps` 接口，通常在组件文件中或相邻的 `types.ts` 中。

### 2.2 最佳实践

- **显式类型**：优先为函数参数和复杂的返回值类型提供显式的类型注解。
- **工具类型**：利用 TypeScript 的工具类型（`Pick`, `Omit`, `Partial`, `Exclude`）重用现有的定义。
- **严格类型**：避免使用 `any`。如果类型确实未知，请使用 `unknown` 并在必要时进行类型转换（cast）。
- **Type 别名 vs. Interface**：使用 `interface` 定义对象结构（特别是 props），使用 `type` 定义联合、交叉或基础类型。

## 3. 代码风格

### 3.1 导入与导出

- **命名导出**：工具函数和模型优先使用命名导出。
- **默认导出**：对于文件中的主组件或主类，使用默认导出。
- **纯类型导入**：使用 `import type` 导入类型，以保持清晰的进程边界并减小打包体积。
- **路径别名**：使用 `@/` 引用 `src` 目录（例如：`import { Settings } from '@/models'`）。

### 3.2 语句与逻辑

- **箭头函数**：组件定义和小型工具函数优先使用箭头函数。
- **解构**：对 props 和对象使用解构以提高可读性。
- **条件逻辑**：使用可选链 (`?.`) 和空值合并运算符 (`??`) 以更安全地访问属性。

### 3.3 代码间距与空行

使用空行分隔具有不同执行风格或视觉外观的代码。**如果相邻的两行代码看起来风格不同，必须在它们之间添加空行。**

**何时添加空行：**

- 数据获取和 return 语句之间
- 变量计算和使用之间
- 多个连续操作（不同的独立步骤）之间
- 在 early return 之前
- 不同的操作类型之间（同步 vs 异步，查询 vs 修改）
- 状态变更前后

**推荐：**

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

**避免：**

```typescript
async getSnapshot(weight_threshold = 0.2) {
	const nodes = await this.query(sql.sql_get_snapshot_nodes(weight_threshold))
	const edges = await this.query(sql.sql_get_snapshot_edges(weight_threshold))
	return { nodes, edges }
}
```

## 4. 总结检查清单

- [ ] 变量名是否为 `snake_case`？
- [ ] 函数名是否为 `camelCase`？
- [ ] 组件 props 是否使用了 `IProps` 或 `IProps*`？
- [ ] 纯类型导入是否使用了 `import type`？
- [ ] 局部类型是否放在了 `types.ts` 文件中？
- [ ] 是否避免了使用 `any`，而是采用了严格类型或 `unknown`？
- [ ] 是否使用空行分隔了不同的执行风格代码块？
