# Agent Map

This document provides an overview of the packages/app module structure and architecture.

## 1. Module Overview

- **Description**: React frontend application
- **Architecture**: React + MobX + Rsbuild

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/app",
	"structure": {
		"appdata": {
			"app.tsx": { "desc": "Main application data entry point", "role": "Provider" },
			"chat.ts": { "desc": "Chat data service logic", "role": "Service" },
			"consts.ts": { "desc": "Application constants", "role": "Constant" },
			"icon.tsx": { "desc": "App icon data", "role": "Asset" },
			"index.ts": { "desc": "Exports for appdata module", "role": "Index" },
			"panel.tsx": { "desc": "Panel configuration data", "role": "Config" },
			"setting.tsx": { "desc": "Settings configuration data", "role": "Config" }
		},
		"components": {
			"Alert.tsx": { "desc": "Reusable alert component", "role": "Component" },
			"AutoLabel.tsx": { "desc": "Auto-sizing label component", "role": "Component" },
			"Container.tsx": { "desc": "Layout container component", "role": "Component" },
			"Controller.tsx": { "desc": "App control logic component", "role": "Component" },
			"Dialog.tsx": { "desc": "Modal dialog component", "role": "Component" },
			"ErrorBoundary.tsx": { "desc": "React error boundary", "role": "Component" },
			"Lazy.tsx": { "desc": "Lazy loading wrapper for dynamic imports", "role": "Component" },
			"ProviderIcon.tsx": { "desc": "AI provider icon renderer", "role": "Component" },
			"Show.tsx": { "desc": "Conditional rendering component", "role": "Component" },
			"Sidebar.tsx": { "desc": "Side navigation component", "role": "Component" },
			"Tabs.tsx": { "desc": "Tab navigation component", "role": "Component" },
			"index.ts": { "desc": "Components module exports", "role": "Index" }
		},
		"context": {
			"global.ts": { "desc": "Global application context", "role": "Context" },
			"index.ts": { "desc": "Context module exports", "role": "Index" }
		},
		"hooks": {
			"index.ts": { "desc": "Hooks module exports", "role": "Index" },
			"useAliveEffect.ts": { "desc": "Hook for keep-alive effects", "role": "Hook" },
			"useMounted.ts": { "desc": "Hook to check mount status", "role": "Hook" },
			"useScrollToBottom.ts": { "desc": "Hook to auto-scroll containers to bottom", "role": "Hook" },
			"useScrollToItem.ts": { "desc": "Hook to scroll to specific item", "role": "Hook" },
			"useSize.ts": { "desc": "Hook to observe element size changes", "role": "Hook" }
		},
		"index.tsx": { "desc": "Application entry point", "role": "Entry" },
		"layout": {
			"components": {
				"Alert.tsx": { "desc": "Layout alert banner", "role": "Component" },
				"Header": {
					"index.tsx": { "desc": "Application header layout with navigation", "role": "Layout" }
				},
				"index.ts": { "desc": "Layout components exports", "role": "Index" }
			},
			"index.tsx": { "desc": "Main application layout structure", "role": "Layout" },
			"types.ts": { "desc": "Layout type definitions", "role": "Type" }
		},
		"locales": {
			"en": {
				"global.ts": { "desc": "English global strings", "role": "Locale" },
				"provider.ts": { "desc": "English provider strings", "role": "Locale" },
				"index.ts": { "desc": "English locale entry", "role": "Index" }
			},
			"zh-cn": {
				"global.ts": { "desc": "Chinese global strings", "role": "Locale" },
				"provider.ts": { "desc": "Chinese provider strings", "role": "Locale" },
				"index.ts": { "desc": "Chinese locale entry", "role": "Index" }
			},
			"dayjs": {
				"en.ts": { "desc": "Day.js English locale", "role": "Locale" },
				"zh-cn.ts": { "desc": "Day.js Chinese locale", "role": "Locale" }
			},
			"index.ts": { "desc": "Locales module exports", "role": "Index" }
		},
		"models": {
			"common": {
				"util.ts": { "desc": "Model utility functions", "role": "Utility" },
				"index.ts": { "desc": "Model common exports", "role": "Index" }
			},
			"global.ts": { "desc": "Global application state model", "role": "Model" },
			"locale.ts": { "desc": "Locale state model", "role": "Model" },
			"setting.ts": { "desc": "User settings state model", "role": "Model" },
			"theme.ts": { "desc": "Theme state model", "role": "Model" },
			"index.ts": { "desc": "Models module exports", "role": "Index" }
		},
		"pages": {
			"agent": { "index.tsx": { "desc": "Agent page view", "role": "Page" } },
			"bookmark": { "index.tsx": { "desc": "Bookmark page view", "role": "Page" } },
			"browser": { "index.tsx": { "desc": "Browser page view", "role": "Page" } },
			"database": { "index.tsx": { "desc": "Database page view", "role": "Page" } },
			"notebook": { "index.tsx": { "desc": "Notebook page view", "role": "Page" } },
			"project": { "index.tsx": { "desc": "Project page view", "role": "Page" } },
			"search": { "index.tsx": { "desc": "Search page view", "role": "Page" } },
			"setting": { "index.tsx": { "desc": "Setting page entry point", "role": "Page" } },
			"task": { "index.tsx": { "desc": "Task page view", "role": "Page" } }
		},
		"panel": {
			"agent": { "index.tsx": { "desc": "Agent panel view", "role": "View" } },
			"bookmark": { "index.tsx": { "desc": "Bookmark panel view", "role": "View" } },
			"search": { "index.tsx": { "desc": "Search panel view", "role": "View" } },
			"index.tsx": { "desc": "Main panel view container", "role": "View" },
			"model.ts": { "desc": "Panel container state model", "role": "Model" }
		},
		"presets": {
			"index.ts": { "desc": "Presets module exports", "role": "Index" },
			"mobx.ts": { "desc": "MobX configuration preset", "role": "Config" },
			"window.ts": { "desc": "Window behavior presets", "role": "Config" }
		},
		"setting": {
			"about": { "index.tsx": { "desc": "About setting view", "role": "View" } },
			"general": { "index.tsx": { "desc": "General settings view", "role": "View" } },
			"memory": { "index.tsx": { "desc": "Memory settings view", "role": "View" } },
			"provider": {
				"ai-sdk-panel": {
					"components": { "desc": "Provider panel components", "role": "Component" },
					"providers": { "desc": "Preset AI providers configuration", "role": "Config" },
					"index.tsx": { "desc": "AI SDK configuration panel", "role": "View" },
					"model.ts": { "desc": "AI SDK panel state model", "role": "Model" },
					"types.ts": { "desc": "AI SDK panel type definitions", "role": "Type" }
				},
				"index.tsx": { "desc": "AI provider settings view", "role": "View" }
			},
			"index.tsx": { "desc": "Main setting layout view", "role": "View" },
			"model.ts": { "desc": "Setting layout state model", "role": "Model" },
			"types.ts": { "desc": "Setting layout types", "role": "Type" }
		},
		"styles": {
			"global.css": { "desc": "Global CSS styles", "role": "Style" },
			"index.css": { "desc": "Main CSS entry", "role": "Style" },
			"streamdown.css": { "desc": "Streamdown Markdown rendering styles", "role": "Style" },
			"vars.css": { "desc": "CSS variables definition", "role": "Style" },
			"shadcn.css": { "desc": "shadcn/ui base styles", "role": "Style" },
			"utility.css": { "desc": "Utility CSS classes", "role": "Style" }
		},
		"types": {
			"app.ts": { "desc": "App domain types", "role": "Type" },
			"dayjs.ts": { "desc": "Day.js type extensions", "role": "Type" },
			"index.ts": { "desc": "Types module exports", "role": "Index" },
			"utils.ts": { "desc": "Utility types", "role": "Type" }
		},
		"utils": {
			"alert.ts": { "desc": "Alert utility", "role": "Utility" },
			"ipc.ts": { "desc": "IPC client utility", "role": "Utility" },
			"theme.ts": { "desc": "Theme management utility", "role": "Utility" },
			"i18n.ts": { "desc": "i18n setup utility", "role": "Utility" },
			"index.ts": { "desc": "Utils module exports", "role": "Index" }
		}
	}
}
```

## 3. Operational Guidelines

- **IPC Communication**: Use `packages/erpc` for main/renderer communication
- **Shared Logic**: Place reusable utilities in `packages/stk` rather than local `utils/`
