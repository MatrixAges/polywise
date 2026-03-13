---
name: css
description: 指导使用 TailwindCSS + CSS Modules 实现样式。在处理组件样式、布局设计或 CSS 模式时触发。
---

# CSS 样式指南

此技能提供了本项目中结合 TailwindCSS + CSS Modules 进行样式实现的强制性规范。

## 1. 架构概览

本项目采用混合样式策略：

- **TailwindCSS**: 用于简单的、实用优先的样式和布局。
- **CSS Modules**: 用于复杂的状态管理、组件特定的样式和高可维护性需求。
- **Rsbuild + Lightning CSS**: 提供带有 PostCSS 支持的现代 CSS 处理。

## 2. 样式策略决策树

### 何时使用 TailwindCSS

```typescript
// ✅ 使用 TailwindCSS:
// - 简单的布局（flex, grid, 定位）
// - 基础间距（margin, padding）
// - 基础颜色和排版
// - 一次性样式
// - 快速原型

<div className='flex items-center gap-3 p-4'>
  <span className='text-std-600'>内容</span>
</div>
```

### 何时使用 CSS Modules

```typescript
// ✅ 使用 CSS Modules:
// - 复杂的状态过渡（hover, active, focus 状态组合）
// - 组件专属的动画
// - 嵌套选择器模式
// - 重复的复杂样式
// - 黑暗模式切换逻辑
// - 会导致 TailwindCSS 类名字符串过长的样式组合

import styles from './index.module.css'

<div className={`w_100 border_box relative${styles._local}`}>
  <button className='btn_copy'></button>
</div>
```

## 3. TailwindCSS 模式

### 3.1 多行类名命名

```typescript
// ✅ 推荐：多行以增加可读性
<div
	className='
		flex
		items-center justify-center
		w-18 h-screen
		is_drag
	'
>
	<Icon size={20}></Icon>
</div>

// ❌ 避免：当样式很复杂时仍写在单行
<div className='flex items-center justify-center w-18 h-screen is_drag'>
```

### 3.2 带有模板字符串的条件样式

```typescript
// ✅ 使用模板字符串管理条件类名
const Index = ({ fold }: { fold: boolean }) => {
	return (
		<nav
			className={`
				relative
				flex flex-col
				h-full
				${fold ? 'w-18 items-center justify-center' : 'border-std-900/8 w-60 border-r py-2'}
			`}
		>
		</nav>
	)
}
```

### 3.3 全局工具类 (Global Utilities)

```typescript
// Electron 窗口拖拽
<div className='is_drag'></div>        // 允许拖动
<div className='no_drag clickable'></div> // 禁止拖动，允许点击

// Lucide 图标边框
<svg className='lucide'></svg>         // 应用 1.8px 的线条宽度

// 自定义工具类
<div className='clickable'></div>      // 鼠标指针 cursor pointer
<div className='border_box'></div>     // box-sizing: border-box
<div className='w_100'></div>          // width: 100%
```

## 4. CSS Modules 模式

### 4.1 文件结构

```css
/* index.module.css */
@reference '../../../styles/index.css'; /* 用于引入 Tailwind 基础 */

._local {
	/* 组件特定的样式 */

	&:hover {
		/* Hover 状态 */
	}

	:global {
		/* 全局类样式（跳过哈希化） */
	}
}
```

### 4.2 嵌套状态与 :global

```css
/* index.module.css */
._local {
	padding: 16px 0;

	&:hover {
		:global {
			.btn_copy {
				opacity: 1;
			}
		}
	}
}

:global {
	.btn_copy {
		opacity: 0;
		transition-property: opacity;

		&:hover {
			@apply bg-std-300;
		}
	}
}
```

### 4.3 使用 @apply

```css
._local {
	/* ✅ 使用 @apply 引入 TailwindCSS 工具类 */
	@apply rounded-xl;

	/* ✅ 将自定义 CSS 与 @apply 混合 */
	padding: 16px 0;

	/* ✅ 将 @apply 用于颜色 */
	:global {
		.lang {
			@apply text-std-400;
		}
	}
}
```

### 4.4 CSS 变量

```css
/* ✅ 使用 snake_case 定义 CSS 变量 */
._local {
	--margin_y: 1.2em;

	p {
		margin-block: var(--margin_y);
	}
}
```

## 5. 颜色系统

项目使用语义化的颜色名称：

```typescript
// TailwindCSS 颜色类名
'text-std-800' // 主要文字
'text-std-600' // 次要文字
'text-std-400' // 柔和文字
'text-std-white' // 白色文字
'text-std-black' // 黑色文字

'bg-std-100' // 主要背景
'bg-std-200' // 次要背景
'bg-std-300' // Hover 悬停背景
'bg-std-800' // 黑暗背景

'border-std-200' // 亮色边框
'border-std-900/8' // 带透明度的暗色边框
```

## 6. 约束与最佳实践

### 6.1 命名约定

- **TailwindCSS**: 使用标准的实用类名。
- **CSS Modules**: 类名必须使用 `snake_case`。
- **CSS 变量**: 使用带有 `--` 前缀的 `snake_case`。
- **组件容器**: 对于主容器类名，始终使用 `_local`。

### 6.2 代码风格

- **TailwindCSS**: 换行格式化以增强可读性。
- **CSS Modules**: 不加任何注释。使用 Tab 缩进。
- **空行**: 用空行分隔不同的逻辑区域。

### 6.3 性能与维护

- **避免冗长字符串**: 不要创建超过 100 个字符的 TailwindCSS 字符串。改用 CSS Modules。
- **不使用内联样式**: 除非必须，避免使用内联的 `style` props。
- **严禁 !important**: 绝对不要在 CSS Modules 中使用 `!important`。
