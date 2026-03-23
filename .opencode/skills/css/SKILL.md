---
name: css
description: Guides styling implementation using TailwindCSS + CSS Modules. Triggered when handling component styles, layout design, or CSS patterns.
---

# CSS Styling Guide

This skill provides mandatory specifications for combining TailwindCSS + CSS Modules for styling implementation in this project.

## 1. Architecture Overview

This project adopts a hybrid styling strategy:

- **TailwindCSS**: For simple, utility-first styles and layouts.
- **CSS Modules**: For complex state management, component-specific styles, and high maintainability needs.
- **Rsbuild + Lightning CSS**: Provides modern CSS processing with PostCSS support.

## 2. Styling Strategy Decision Tree

### When to Use TailwindCSS

```typescript
// ✅ Use TailwindCSS:
// - Simple layouts (flex, grid, positioning)
// - Basic spacing (margin, padding)
// - Basic colors and typography
// - One-off styles
// - Rapid prototyping

<div className='flex items-center gap-3 p-4'>
  <span className='text-std-600'>Content</span>
</div>
```

### When to Use CSS Modules

```typescript
// ✅ Use CSS Modules:
// - Complex state transitions (hover, active, focus state combinations)
// - Component-specific animations
// - Nested selector patterns
// - Repeated complex styles
// - Dark mode switching logic
// - Style combinations that would make TailwindCSS class strings too long

import styles from './index.module.css'

<div className={`w_100 border_box relative${styles._local}`}>
  <button className='btn_copy'></button>
</div>
```

## 3. TailwindCSS Patterns

### 3.1 Multi-line Class Naming

```typescript
// ✅ Recommended: multi-line for readability
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

// ❌ Avoid: still writing on single line when styles are complex
<div className='flex items-center justify-center w-18 h-screen is_drag'>
```

### 3.2 Conditional Styles with Template Strings

```typescript
// ✅ Use template strings for conditional class names
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

### 3.3 Global Utilities

```typescript
// Electron window dragging
<div className='is_drag'></div>        // Allow dragging
<div className='no_drag clickable'></div> // Disallow dragging, allow clicking

// Lucide icon borders
<svg className='lucide'></svg>         // Apply 1.8px line width

// Custom utilities
<div className='clickable'></div>      // cursor pointer
<div className='border_box'></div>     // box-sizing: border-box
<div className='w_100'></div>          // width: 100%
```

## 4. CSS Modules Patterns

### 4.1 File Structure

```css
/* index.module.css */
@reference '../../../styles/index.css'; /* For importing Tailwind base */

._local {
	/* Component-specific styles */

	&:hover {
		/* Hover state */
	}

	:global {
		/* Global class styles (skip hashing) */
	}
}
```

### 4.2 Nested States and :global

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

### 4.3 Using @apply

```css
._local {
	/* ✅ Use @apply to include TailwindCSS utilities */
	@apply rounded-xl;

	/* ✅ Mix custom CSS with @apply */
	padding: 16px 0;

	/* ✅ Use @apply for colors */
	:global {
		.lang {
			@apply text-std-400;
		}
	}
}
```

### 4.4 CSS Variables

```css
/* ✅ Use snake_case for CSS variables */
._local {
	--margin_y: 1.2em;

	p {
		margin-block: var(--margin_y);
	}
}
```

## 5. Color System

The project uses semantic color names:

```typescript
// TailwindCSS color classes
'text-std-800' // Primary text
'text-std-600' // Secondary text
'text-std-400' // Muted text
'text-std-white' // White text
'text-std-black' // Black text

'bg-std-100' // Primary background
'bg-std-200' // Secondary background
'bg-std-300' // Hover background
'bg-std-800' // Dark background

'border-std-200' // Light border
'border-std-900/8' // Dark border with opacity
```

## 6. Constraints and Best Practices

### 6.1 Naming Conventions

- **TailwindCSS**: Use standard utility class names.
- **CSS Modules**: Class names must use `snake_case`.
- **CSS Variables**: Use `snake_case` with `--` prefix.
- **Component Container**: Always use `_local` for the main container class name.

### 6.2 Code Style

- **TailwindCSS**: Use line breaks for better readability.
- **CSS Modules**: No comments. Use Tab indentation.
- **Blank Lines**: Separate different logical areas with blank lines.

### 6.3 Performance and Maintenance

- **Avoid Long Strings**: Don't create TailwindCSS strings exceeding 100 characters. Use CSS Modules instead.
- **No Inline Styles**: Avoid inline `style` props unless absolutely necessary.
- **No !important**: Absolutely never use `!important` in CSS Modules.
