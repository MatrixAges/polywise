---
name: i18n
description: Guides internationalization (i18n) implementation using i18next with TypeScript. Triggered when handling localization, translation files, or multilingual support.
---

# i18n Internationalization Guide

This skill provides mandatory specifications for implementing internationalization using i18next in this project.

## 1. Architecture Overview

The project adopts a modular i18n structure:

- **i18next**: Core internationalization library.
- **TypeScript**: Provides complete type safety protection for translation keys.
- **Modular Structure**: Translation copy is organized by functionality/module.
- **Dual-end Support**: Simultaneously supports app (renderer process) and desktop (main process).

## 2. Translation File Structure

### 2.1 Basic Translation Module

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

### 2.2 Namespace Module

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

### 2.3 Regional Language Entry Point

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
} as const // ✅ Must use as const to ensure TypeScript type inference
```

## 3. Steps for Adding New Translations

### 3.1 Adding New Module Translation

```typescript
// Step 2: Add to entry index
// packages/app/locales/en/index.ts
import newFeature from './newFeature'

// Step 1: Create new translation file (English and Chinese must be created simultaneously)
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
		// ... others
		newFeature // Register new module
	}
} as const
```

## 4. Constraints and Best Practices

### 4.1 Naming Conventions

- **Keys**: Translation keys must use `snake_case`.
- **Structure**: Organize key names hierarchically by functionality or component.
- **Consistency**: Must maintain completely consistent key name structure across all language files.

### 4.2 Code Style Requirements

- **No Comments**: Do not add any comments to translation files.
- **Default Export**: Always use `export default` to export translation objects.
- **Type Safety**: In regional language index exports, **always** use `as const`.
- **Flat Structure**: Keep translation objects as flat as possible (nesting should not exceed 3 levels).

### 4.3 Dynamic Content and Interpolation

```typescript
// In translation file
export default {
	welcome_message: 'Welcome, ${name}!',
	item_count: 'You have ${count} items'
}

// In component
const { t } = useTranslation()
t('welcome_message', { name: 'John' })
```

### 4.4 Quality Guidelines

- **Translation Completeness**: In **all** supported language files, **all** keys must have corresponding translations.
- **Context**: When words are ambiguous, accurate translations must be provided based on context.
- **Avoid Hardcoding**: In React components, never hardcode visible Chinese or English characters; they must be extracted to locale files.
