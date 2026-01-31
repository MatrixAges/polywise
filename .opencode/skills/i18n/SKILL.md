---
name: i18n
description: Guides the implementation of internationalization (i18n) using i18next with TypeScript. Triggered when working on localization, translation files, or multi-language support.
---

# i18n Skill

This skill provides mandatory instructions for implementing internationalization using i18next in this project.

## 1. Architecture Overview

The project uses a modular i18n structure with the following components:

- **i18next**: Core internationalization library
- **TypeScript**: Full type safety for translation keys
- **Modular Structure**: Translations organized by feature/module
- **Dual Support**: Both app (renderer) and desktop (main process) support

## 2. Directory Structure

### App (Renderer Process)

```
packages/app/locales/
├── index.ts                    # Main locale exports
├── en/                         # English translations
│   ├── index.ts               # English entry point
│   ├── global.ts              # Global/common strings
│   ├── app.ts                 # App-specific strings
│   ├── setting.ts             # Settings strings
│   ├── layout.ts              # Layout strings
│   ├── components.ts          # Component strings
│   ├── editor.ts              # Editor strings
│   ├── chatbox.ts             # Chatbox strings
│   ├── ai.ts                  # AI-related strings
│   ├── chat.ts                # Chat strings
│   └── note.ts                # Note strings
├── zh-cn/                     # Chinese translations (same structure as en)
├── antd/                      # Ant Design locale files
│   ├── en.ts
│   └── zh-cn.ts
└── dayjs/                     # Day.js locale files
    ├── en.ts
    └── zh-cn.ts
```

### Desktop (Main Process)

```
packages/desktop/src/locales/
├── en/
│   ├── index.ts
│   └── global.ts
└── zh-cn/
    ├── index.ts
    └── global.ts
```

## 3. Translation File Structure

### 3.1 Basic Translation Module

```typescript
// packages/app/locales/en/global.ts
export default {
	$: '$',
	b: ' ',
	s: 's',
	a: 'a',
	an: 'an',
	unique: 'unique',
	notice: 'Notice',
	edit: 'Edit',
	add: 'Add',
	save: 'Save',
	remove: 'Remove',
	recent: 'Recent',
	icon: 'Icon',
	emoji: 'Emoji',
	to: 'to',
	favorite: 'Favorite',
	conversation: 'Conversation',
	role: 'Role',
	inspect: 'Inspect',
	model: 'Model',
	group: 'Group',
	reset: 'Reset',
	input: 'Input',
	cancel: 'Cancel',
	million: 'Million',
	select: 'Select',
	naming: 'Naming',
	summary: 'Summary',
	translate: 'Translate',
	reload: 'Reload',
	copied: 'Copied',
	confirm: 'Confirm',
	preview: 'Preview',
	insert: 'Insert',
	reset_confirm: 'Reset will remove all configuration changes, confirm reset?',
	remove_confirm:
		'Confirm removal? Deleting this item will also delete the corresponding local file. Please proceed with caution!',
	config_remove_confirm:
		'Deleting this item will delete the corresponding configuration data. Are you sure you want to delete it?'
}
```

### 3.2 Namespaced Translation Module

```typescript
// packages/app/locales/en/app.ts
export default {
	module: {
		chat: 'Chat',
		research: 'Research',
		agent: 'Agent',
		flow: 'Flow',
		linkcase: 'Linkcase',
		memory: 'Memory',
		note: 'Note',
		database: 'Database',
		artifact: 'Artifact'
	},
	workspace: {
		title: 'Workspace',
		name_placeholder: 'A unique name',
		confirm: 'Removing the workspace will delete all files under it. Are you sure you want to delete this workspace? Click save to apply changes. Please proceed with caution!',
		tips: 'Workspaces are used to differentiate between various working environments, such as using two separate workspaces for company projects and personal projects to create isolation. A single workspace implies an independent storage directory.'
	},
	ErrorBoundary: {
		title: 'Something Error',
		desc: 'App encountered unexpected exception'
	}
}
```

### 3.3 Locale Entry Point

```typescript
// packages/app/locales/en/index.ts
import ai from './ai'
import app from './app'
import chat from './chat'
import chatbox from './chatbox'
import components from './components'
import editor from './editor'
import global from './global'
import layout from './layout'
import note from './note'
import setting from './setting'

export default {
	translation: {
		...global,
		app,
		setting,
		layout,
		components,
		editor,
		chatbox,
		ai,
		chat,
		note
	}
} as const
```

## 4. Type Safety Configuration

### 4.1 Type Declarations

```typescript
// packages/app/typings/i18n.d.ts
import { en } from '@/locales'

declare module 'i18next' {
	interface CustomTypeOptions {
		returnObjects: true
		resources: typeof en
	}
}
```

### 4.2 Resource Backend

```typescript
// packages/app/utils/i18n.ts
import type { BackendModule } from 'i18next'

export const resourcesToBackend = {
	type: 'backend',
	read: (lang, namespace, callback) => {
		import(`@/locales/${lang.toLowerCase()}/index`).then(data => {
			callback(null, data.default[namespace])
		})
	}
} as BackendModule
```

## 5. Ant Design Localization

```typescript
// packages/app/locales/antd/en.ts
import Calendar from 'antd/es/calendar/locale/en_US'
import DatePicker from 'antd/es/date-picker/locale/en_US'
import TimePicker from 'antd/es/time-picker/locale/en_US'

const typeTemplate = '${label} is not a valid ${type}'
const localeValues = {
	locale: 'en',
	Pagination: {
		// Options
		items_per_page: '/ page',
		jump_to: 'Go to',
		jump_to_confirm: 'confirm',
		page: 'Page',
		// Pagination
		prev_page: 'Previous Page',
		next_page: 'Next Page',
		prev_5: 'Previous 5 Pages',
		next_5: 'Next 5 Pages',
		prev_3: 'Previous 3 Pages',
		next_3: 'Next 3 Pages',
		page_size: 'Page Size'
	},
	DatePicker,
	TimePicker,
	Calendar,
	global: {
		placeholder: 'Please select'
	}
	// ... other Ant Design components
}
export default localeValues
```

## 6. Day.js Localization

```typescript
// packages/app/locales/dayjs/en.ts
import type { DayJSLocale } from '@/types'

export default {
	name: 'en',
	weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
	weekStart: 1,
	months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
	relativeTime: {
		future: 'after %s',
		past: '%s ago',
		s: 'a few seconds',
		m: 'a minute',
		mm: '%d minutes',
		h: 'an hour',
		hh: '%d hours',
		d: 'a day',
		dd: '%d days',
		M: 'a month',
		MM: '%d months',
		y: 'a year',
		yy: '%d years'
	},
	ordinal: n => {
		const s = ['th', 'st', 'nd', 'rd']
		const v = n % 100
		return `[${n}${s[(v - 20) % 10] || s[v] || s[0]}]`
	}
} as DayJSLocale
```

## 7. Desktop Process Localization

```typescript
// packages/desktop/src/locales/en/global.ts
export default {
	app: {
		name: 'Polywise',
		quit: 'Quit',
		hide: 'Hide',
		hide_others: 'Hide Others',
		show_all: 'Show All',
		about: 'About',
		preferences: 'Preferences',
		services: 'Services',
		close: 'Close',
		minimize: 'Minimize',
		zoom: 'Zoom',
		bring_all_to_front: 'Bring All to Front'
	},
	tray: {
		show: 'Show',
		quit: 'Quit'
	}
}
```

## 8. Implementation Examples

### 8.1 Adding New Translation Module

```typescript
// Step 2: Add to locale index
// packages/app/locales/en/index.ts
import newFeature from './newFeature'

// Step 1: Create new translation file
// packages/app/locales/en/newFeature.ts
export default {
	title: 'New Feature',
	description: 'This is a new feature description',
	actions: {
		save: 'Save',
		cancel: 'Cancel',
		delete: 'Delete'
	},
	messages: {
		success: 'Operation completed successfully',
		error: 'An error occurred'
	}
}

// ... other imports

export default {
	translation: {
		...global,
		app,
		setting,
		layout,
		components,
		editor,
		chatbox,
		ai,
		chat,
		note,
		newFeature // Add new module
	}
} as const

// Step 3: Create corresponding Chinese translation
// packages/app/locales/zh-cn/newFeature.ts
export default {
	title: '新功能',
	description: '这是新功能描述',
	actions: {
		save: '保存',
		cancel: '取消',
		delete: '删除'
	},
	messages: {
		success: '操作成功完成',
		error: '发生错误'
	}
}
```

### 8.2 Adding New Language Support

```typescript
// Step 1: Create new language directory
// packages/app/locales/es/ (Spanish)
// packages/app/locales/es/index.ts
import ai from './ai'
import app from './app'

// ... import all modules

export default {
	translation: {
		...global,
		app,
		setting,
		layout,
		components,
		editor,
		chatbox,
		ai,
		chat,
		note
	}
} as const

// Step 2: Create all module files in Spanish
// packages/app/locales/es/global.ts
export default {
	$: '$',
	edit: 'Editar',
	add: 'Agregar',
	save: 'Guardar',
	remove: 'Eliminar'
	// ... other translations
}

// Step 3: Add to language options
// Update locale_options in appdata
```

## 9. Constraints & Best Practices

### 9.1 Naming Conventions

- **Keys**: Use snake_case for translation keys
- **Structure**: Organize keys hierarchically by feature/component
- **Consistency**: Maintain identical key structure across all languages
- **Descriptive**: Use descriptive key names that indicate purpose

### 9.2 Code Style Requirements

- **No Comments**: DO NOT add comments to translation files
- **Export Default**: ALWAYS use `export default` for translation modules
- **Type Safety**: ALWAYS use `as const` for locale index exports
- **Immutability**: Translation objects MUST be immutable

### 9.3 File Organization

- **One Feature Per File**: Create separate files for different features/modules
- **Flat Structure**: Keep translation objects relatively flat (max 3 levels deep)
- **Group Related**: Group related translations together under logical namespaces
- **Alphabetical**: Maintain alphabetical order within translation objects

### 9.4 Quality Guidelines

- **Complete Translations**: ALL keys must have translations in ALL supported languages
- **Consistent Terminology**: Use consistent terminology across the application
- **Context Awareness**: Provide context for ambiguous terms
- **Pluralization**: Handle plural forms appropriately
- **Variables**: Use `${variable}` syntax for dynamic content

### 9.5 Technical Constraints

- **No Dynamic Keys**: DO NOT generate translation keys dynamically at runtime
- **Type Safety**: ALWAYS maintain TypeScript type safety
- **Bundle Size**: Be mindful of bundle size; use code splitting for large translations
- **Performance**: Use efficient import patterns to avoid unnecessary bundle bloat

## 10. Common Patterns

### 10.1 Dynamic Content

```typescript
// In translation file
export default {
	welcome_message: 'Welcome, ${name}!',
	item_count: 'You have ${count} items',
	items: {
		one: '${count} item',
		other: '${count} items'
	}
}

// In component
const { t } = useTranslation()
t('welcome_message', { name: 'John' })
t('item_count', { count: 5 })
t('items', { count: 1 }) // Returns "1 item"
t('items', { count: 5 }) // Returns "5 items"
```

### 10.2 Nested Structures

```typescript
// In translation file
export default {
	buttons: {
		save: 'Save',
		cancel: 'Cancel',
		delete: 'Delete'
	},
	messages: {
		success: 'Operation successful',
		error: 'An error occurred'
	}
}

// In component
t('buttons.save')
t('messages.success')
```

### 10.3 Interpolation with HTML

```typescript
// In translation file
export default {
	terms: 'I agree to the <1>Terms of Service</1> and <2>Privacy Policy</2>'
}

// In component
<Trans
	i18nKey="terms"
	components={[
		<a href="/terms">Terms of Service</a>,
		<a href="/privacy">Privacy Policy</a>
	]}
/>
```
