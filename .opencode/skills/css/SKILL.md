---
name: css
description: Guides the implementation of styling using TailwindCSS + CSS Modules. Triggered when working on component styling, layout design, or CSS patterns.
---

# CSS Styling Skill

This skill provides mandatory instructions for implementing styling using TailwindCSS + CSS Modules in this project.

## 1. Architecture Overview

The project uses a hybrid styling approach:

- **TailwindCSS**: For simple, utility-first styles and layouts
- **CSS Modules**: For complex state management, component-specific styles, and maintainability
- **Rsbuild + Lightning CSS**: For modern CSS processing with PostCSS support

## 2. Directory Structure

```
packages/app/
├── styles/
│   ├── global.css              # Global styles
│   ├── index.css               # Main CSS entry
│   ├── vars.css                # CSS variables
│   └── md.module.css           # Markdown specific styles
└── components/
    ├── Modal.tsx               # Pure TailwindCSS
    └── Markdown/
        └── components/
            ├── Code/
            │   ├── index.tsx
            │   └── index.module.css  # CSS Modules for complex styles
            └── ...
```

## 3. Style Strategy Decision Tree

### When to Use TailwindCSS

```typescript
// ✅ Use TailwindCSS for:
// - Simple layouts (flex, grid, positioning)
// - Basic spacing (margin, padding)
// - Simple colors and typography
// - One-off styles
// - Quick prototyping

<div className='flex items-center gap-3 p-4'>
  <span className='text-std-600'>Content</span>
</div>
```

### When to Use CSS Modules

```typescript
// ✅ Use CSS Modules for:
// - Complex state transitions (hover, active, focus states)
// - Component-specific animations
// - Nested selector patterns
// - Repeated complex styles
// - Dark mode switching
// - Styles that would create overly long TailwindCSS class strings

import styles from './index.module.css'

<div className={`w_100 border_box relative${styles._local}`}>
  <button className='btn_copy'></button>
</div>
```

## 4. TailwindCSS Patterns

### 4.1 Multi-line Class Naming

```typescript
// ✅ Preferred: Multi-line for readability
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

// ❌ Avoid: Single-line when complex
<div className='flex items-center justify-center w-18 h-screen is_drag'>
```

### 4.2 Conditional Styles with Template Strings

```typescript
// ✅ Use template strings for conditional styles
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

### 4.3 Common Layout Patterns

```typescript
// Flexbox Center
<div className='flex items-center justify-center h-full'></div>

// Flexbox Gap
<div className='flex flex-col gap-4'></div>

// Absolute Positioning
<div className='absolute top-2 right-2'></div>

// Responsive with Breakpoints
<div className='max-[720px]:p-0 p-6'></div>

// Hover States
<div className='hover:bg-std-300/60 hover:text-std-900 clickable'></div>

// Rounded Variants
<div className='rounded-full'></div>
<div className='rounded-xl'></div>
<div className='rounded-md'></div>
```

### 4.4 Global Utility Classes

```typescript
// Electron Window Dragging
<div className='is_drag'></div>        // Enable drag region
<div className='no_drag clickable'></div> // Disable drag, enable click

// Lucide Icon Stroke
<svg className='lucide'></svg>         // Apply 1.8px stroke-width

// Custom Utilities
<div className='clickable'></div>      // Cursor pointer
<div className='border_box'></div>     // box-sizing: border-box
<div className='w_100'></div>          // width: 100%
```

## 5. CSS Modules Patterns

### 5.1 File Structure

```css
/* index.module.css */
@reference '../../../styles/index.css';

._local {
	/* Component-specific styles */

	&:hover {
		/* Hover state */
	}

	:global {
		/* Global class styles */
	}
}
```

### 5.2 Component Integration

```typescript
// Component file
import styles from './index.module.css'

const Index = () => {
	return (
		<div className={`w_100 border_box relative${styles._local}`}>
			<button className='btn_copy'></button>
		</div>
	)
}
```

### 5.3 Nested States with :global

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

### 5.4 Using @apply for TailwindCSS

```css
._local {
	/* ✅ Use @apply for TailwindCSS utilities */
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

### 5.5 CSS Variables

```css
/* ✅ Define CSS variables with snake_case */
._local {
	--margin_y: 1.2em;

	p {
		margin-block: var(--margin_y);
	}
}
```

### 5.6 Complex State Transitions

```css
/* ✅ Use CSS Modules for complex transitions */
._local {
	.btn {
		opacity: 0;
		transition-property: opacity;

		&:hover {
			@apply bg-std-300;
		}
	}

	/* ✅ Parent-child hover effects */
	&:hover {
		.btn {
			opacity: 1;
		}
	}
}
```

## 6. Implementation Examples

### 6.1 Simple Component (Pure TailwindCSS)

```typescript
// settings/components/Item.tsx
const Index = ({ Icon, title, desc }: IProps) => {
	return (
		<div
			className='
				flex
				items-center justify-between
				w-full
				min-h-10
				gap-3
			'
		>
			<div className='flex items-center'>
				<div
					className='
						flex shrink-0
						items-center justify-center
						w-[21px] h-[21px]
						mr-4
						text-[21px]
					'
				>
					<Icon />
				</div>
				<div className='flex flex-col'>
					<span className='leading-none font-medium'>{title}</span>
					{desc && <span className='text-gray mt-1 text-xs'>{desc}</span>}
				}
			</div>
		</div>
	)
}
```

### 6.2 Component with CSS Modules

```typescript
// components/Markdown/components/Code/index.tsx
import styles from './index.module.css'

const Index = ({ children, language }: IProps) => {
	return (
		<div className={`w_100 border_box relative${styles._local}`}>
			<span className='lang absolute'>{language}</span>
			<button className='absolute flex btn_copy justify_center align_center clickable'>
				<Copy></Copy>
			</button>
			<div className='pre_wrap w_100 flex'></div>
		</div>
	)
}
```

```css
/* components/Markdown/components/Code/index.module.css */
@reference '../../../../styles/index.css';

._local {
	padding: 16px 0;
	font-size: 12px;

	&:hover {
		:global {
			.btn_copy {
				opacity: 1;
			}
		}
	}

	@apply rounded-xl;

	:global {
		.btn_copy {
			opacity: 0;
			transition-property: opacity;

			&:hover {
				@apply bg-std-300;
			}
		}
	}
}
```

### 6.3 Complex Component with Conditional Styles

```typescript
// pages/home/components/Sidebar.tsx
const Index = ({ fold, toggleSidebar }: IProps) => {
	return (
		<nav
			className={`
				relative
				flex flex-col
				h-full
				${fold ? 'w-18 items-center justify-center' : 'border-std-900/8 w-60 border-r py-2'}
			`}
		>
			<div
				className={`
					flex
					items-center
					px-4
					group
					${fold ? 'absolute top-4 justify-center' : 'border-std-900/8 justify-between border-b pb-2'}
				`}
			>
				<div
					className={`
						flex
						items-center justify-center
						fill-std-800
						${fold ? 'h-8 w-8 group-hover:opacity-0' : 'h-6 w-6'}
					`}
				>
					<Logo></Logo>
				</div>
			</div>
		</nav>
	)
}
```

## 7. CSS Variables System

### 7.1 Global Variables

```css
/* styles/vars.css */
:root {
	--radius: 4px;
}
```

### 7.2 Using Variables

```css
._local {
	--margin_y: 1.2em;

	p {
		margin-block: var(--margin_y);
	}
}
```

## 8. Color System

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
'bg-std-300' // Hover state
'bg-std-800' // Dark background

'border-std-200' // Light border
'border-std-900/8' // Dark border with opacity
```

## 9. Constraints & Best Practices

### 9.1 Naming Conventions

- **TailwindCSS**: Use standard utility classes
- **CSS Modules**: Use `snake_case` for class names
- **CSS Variables**: Use `snake_case` with `--` prefix
- **Component Classes**: Use `_local` for main container

### 9.2 Code Style

- **TailwindCSS**: Multi-line format for readability
- **CSS Modules**: No comments
- **Indentation**: Use tabs
- **Empty Lines**: Use blank lines to separate logical sections

### 9.3 Performance

- **Avoid Over-Tailwinding**: Don't create overly long class strings (> 100 characters)
- **Use CSS Modules**: For complex state transitions and repeated patterns
- **Lazy Loading**: Component-specific CSS Modules are automatically code-split
- **Minification**: Lightning CSS automatically minifies production builds

### 9.4 Maintainability

- **Prefer CSS Modules** for:
     - Complex hover/active/focus states
     - Animations and transitions
     - Dark mode variations
     - Repeated complex patterns
- **Prefer TailwindCSS** for:
     - Simple layouts
     - One-off styles
     - Quick iterations
     - Design system consistency

### 9.5 Technical Constraints

- **No Inline Styles**: Avoid inline `style` props unless necessary
- **No !important**: Never use `!important` in CSS Modules
- **Class Scoping**: Always use CSS Modules for component-specific styles
- **Global Styles**: Place global styles in `styles/global.css`

## 10. Common Patterns

### 10.1 Icon Button

```typescript
<div
	className='
		flex
		items-center justify-center
		w-6 h-6
		rounded-full
		hover:bg-std-200/60
		clickable
	'
	onClick={handleClick}
>
	<Icon size={14} />
</div>
```

### 10.2 Card Layout

```typescript
<div
	className='
		relative
		overflow-hidden
		flex flex-col
		max-h-full
		px-6 py-4
		mx-auto
		rounded-xl
		bg-std-100
	'
>
	<div className='header'></div>
	<div className='content overflow-y-auto flex w-full h-full'></div>
</div>
```

### 10.3 Navigation Item

```typescript
<div
	className={`
		flex
		items-center
		h-12
		hover:bg-std-300/60 hover:text-std-900
		clickable
		${fold ? 'w-12 justify-center rounded-full' : 'gap-4 rounded-full px-3.5'}
	`}
	onClick={handleClick}
>
	<Icon size={fold ? 20 : 18}></Icon>
	{!fold && <span className='capitalize'>{label}</span>}
</div>
```

### 10.4 Code Block with Copy Button

```typescript
// CSS
._local {
	&:hover {
		:global {
			.btn_copy {
				opacity: 1;
			}
		}
	}

	:global {
		.btn_copy {
			opacity: 0;
			transition-property: opacity;
		}
	}
}

// TSX
<div className={`w_100 border_box relative${styles._local}`}>
	<button className='absolute flex btn_copy justify_center align_center clickable'>
		<Copy></Copy>
	</button>
	<div className='pre_wrap w_100 flex'></div>
</div>
```
