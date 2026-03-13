---
name: i18n
description: 指导使用 i18next 与 TypeScript 实现国际化 (i18n)。在处理本地化、翻译文件或多语言支持时触发。
---

# i18n 国际化指南

此技能提供了在项目中强制使用 i18next 实现国际化的规范。

## 1. 架构概览

项目采用了模块化的 i18n 结构：

- **i18next**: 核心国际化库。
- **TypeScript**: 对翻译键 (Translation Keys) 提供完整的类型安全保护。
- **模块化结构**: 翻译文案按功能/模块进行组织。
- **双端支持**: 同时支持 app（渲染进程）和 desktop（主进程）。

## 2. 翻译文件结构

### 2.1 基础翻译模块

```typescript
// packages/app/locales/en/global.ts
export default {
	notice: 'Notice',
	edit: 'Edit',
	add: 'Add',
	save: 'Save',
	remove: 'Remove',
	remove_confirm:
		'Confirm removal? Deleting this item will also delete the corresponding local file. Please proceed with caution!'
}
```

### 2.2 命名空间模块

```typescript
// packages/app/locales/en/app.ts
export default {
	module: {
		chat: 'Chat',
		research: 'Research',
		agent: 'Agent'
	},
	workspace: {
		title: 'Workspace',
		name_placeholder: 'A unique name'
	}
}
```

### 2.3 区域语言入口点 (Locale Entry Point)

```typescript
// packages/app/locales/en/index.ts
import ai from './ai'
import app from './app'
import global from './global'

export default {
	translation: {
		...global,
		app,
		ai
	}
} as const // ✅ 必须使用 as const 以确保 TypeScript 类型推断
```

## 3. 添加新翻译的步骤

### 3.1 增加新模块翻译

```typescript
// 第二步：添加到入口索引
// packages/app/locales/en/index.ts
import newFeature from './newFeature'

// 第一步：创建新翻译文件（英文与中文必须同步创建）
// packages/app/locales/en/newFeature.ts
export default {
	title: 'New Feature',
	description: 'This is a new feature description'
}

// packages/app/locales/zh-cn/newFeature.ts
export default {
	title: '新功能',
	description: '这是新功能描述'
}

export default {
	translation: {
		// ... 其他
		newFeature // 注册新模块
	}
} as const
```

## 4. 约束与最佳实践

### 4.1 命名规范

- **键名 (Keys)**: 翻译键必须使用 `snake_case`。
- **结构**: 按照功能或组件进行层次化组织键名。
- **一致性**: 在所有语言文件中必须保持完全一致的键名结构。

### 4.2 代码风格要求

- **禁止注释**: 不要向翻译文件中添加任何注释。
- **默认导出**: 始终使用 `export default` 导出翻译对象。
- **类型安全**: 在区域语言的 index 导出中，**始终**使用 `as const`。
- **扁平结构**: 翻译对象尽量保持扁平化（嵌套不要超过 3 层）。

### 4.3 动态内容与插值

```typescript
// 在翻译文件中
export default {
	welcome_message: 'Welcome, ${name}!',
	item_count: 'You have ${count} items'
}

// 在组件中
const { t } = useTranslation()
t('welcome_message', { name: 'John' })
```

### 4.4 质量指南

- **翻译完整性**: **所有**支持的语言文件中，**所有**的键都必须有对应的翻译。
- **上下文**: 当词汇有歧义时，必须根据上下文提供准确的翻译。
- **避免硬编码**: 在 React 组件中，永远不要硬编码可见的中文字符或英文字符，必须抽取到 locale 文件中。
