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
			"index.ts": { "desc": "Exports for appdata module", "role": "Index" }
		},
		"components": {
			"Markdown": {
				"components": {
					"A.tsx": { "desc": "Markdown link component", "role": "Component" },
					"Anchor.tsx": { "desc": "Markdown anchor link component", "role": "Component" },
					"Code": {
						"index.module.css": { "desc": "Code block styles", "role": "Style" },
						"index.tsx": { "desc": "Code block component", "role": "Component" }
					},
					"H1.tsx": { "desc": "Markdown H1 heading component", "role": "Component" },
					"H2.tsx": { "desc": "Markdown H2 heading component", "role": "Component" },
					"H3.tsx": { "desc": "Markdown H3 heading component", "role": "Component" },
					"H4.tsx": { "desc": "Markdown H4 heading component", "role": "Component" },
					"H5.tsx": { "desc": "Markdown H5 heading component", "role": "Component" },
					"H6.tsx": { "desc": "Markdown H6 heading component", "role": "Component" },
					"InlineCode.tsx": { "desc": "Inline code component", "role": "Component" },
					"Math.tsx": { "desc": "Math/KaTeX renderer component", "role": "Component" },
					"Mermaid.tsx": { "desc": "Mermaid diagram renderer", "role": "Component" },
					"Pre.tsx": { "desc": "Preformatted text component", "role": "Component" },
					"index.tsx": { "desc": "Markdown sub-components exports", "role": "Index" }
				},
				"index.tsx": { "desc": "Main Markdown viewer component", "role": "Component" }
			},
			"Modal.tsx": { "desc": "Reusable modal dialog component", "role": "Component" },
			"index.ts": { "desc": "Components module exports", "role": "Index" }
		},
		"context": {
			"global.ts": { "desc": "Global application context", "role": "Context" },
			"index.ts": { "desc": "Context module exports", "role": "Index" }
		},
		"hooks": {
			"index.ts": { "desc": "Hooks module exports", "role": "Index" },
			"useScrollToBottom.ts": { "desc": "Hook to auto-scroll containers to bottom", "role": "Hook" },
			"useSize.ts": { "desc": "Hook to observe element size changes", "role": "Hook" }
		},
		"index.tsx": { "desc": "Application entry point", "role": "Entry" },
		"layout": {
			"components": {
				"Page": { "index.tsx": { "desc": "Page layout container", "role": "Layout" } },
				"Panel": { "index.tsx": { "desc": "Panel container component", "role": "Layout" } },
				"Sidebar.tsx": { "desc": "Sidebar layout component", "role": "Layout" },
				"Tab": { "index.tsx": { "desc": "Tab navigation component", "role": "Layout" } },
				"index.ts": { "desc": "Layout components exports", "role": "Index" }
			},
			"index.tsx": { "desc": "Main application layout wrapper", "role": "Layout" },
			"types.ts": { "desc": "Layout related type definitions", "role": "Type" }
		},
		"locales": {
			"antd": {
				"en.ts": { "desc": "Ant Design English locale", "role": "Locale" },
				"zh-cn.ts": { "desc": "Ant Design Chinese locale", "role": "Locale" }
			},
			"dayjs": {
				"en.ts": { "desc": "Day.js English locale", "role": "Locale" },
				"zh-cn.ts": { "desc": "Day.js Chinese locale", "role": "Locale" }
			},
			"en": {
				"ai.ts": { "desc": "English AI related strings", "role": "Locale" },
				"app.ts": { "desc": "English App general strings", "role": "Locale" },
				"chat.ts": { "desc": "English Chat strings", "role": "Locale" },
				"chatbox.ts": { "desc": "English Chatbox strings", "role": "Locale" },
				"components.ts": { "desc": "English Component strings", "role": "Locale" },
				"editor.ts": { "desc": "English Editor strings", "role": "Locale" },
				"global.ts": { "desc": "English Global strings", "role": "Locale" },
				"index.ts": { "desc": "English locale entry", "role": "Index" },
				"layout.ts": { "desc": "English Layout strings", "role": "Locale" },
				"note.ts": { "desc": "English Note strings", "role": "Locale" },
				"setting.ts": { "desc": "English Settings strings", "role": "Locale" }
			},
			"index.ts": { "desc": "Locales module exports", "role": "Index" },
			"zh-cn": {
				"ai.ts": { "desc": "Chinese AI related strings", "role": "Locale" },
				"app.ts": { "desc": "Chinese App general strings", "role": "Locale" },
				"chat.ts": { "desc": "Chinese Chat strings", "role": "Locale" },
				"chatbox.ts": { "desc": "Chinese Chatbox strings", "role": "Locale" },
				"components.ts": { "desc": "Chinese Component strings", "role": "Locale" },
				"editor.ts": { "desc": "Chinese Editor strings", "role": "Locale" },
				"global.ts": { "desc": "Chinese Global strings", "role": "Locale" },
				"index.ts": { "desc": "Chinese locale entry", "role": "Index" },
				"layout.ts": { "desc": "Chinese Layout strings", "role": "Locale" },
				"note.ts": { "desc": "Chinese Note strings", "role": "Locale" },
				"setting.ts": { "desc": "Chinese Settings strings", "role": "Locale" }
			}
		},
		"models": {
			"Global.ts": { "desc": "Global application state model", "role": "Model" },
			"Settings.ts": { "desc": "User settings state model", "role": "Model" },
			"common": {
				"Util.ts": { "desc": "Model utility functions", "role": "Utility" },
				"index.ts": { "desc": "Model common exports", "role": "Index" }
			},
			"index.ts": { "desc": "Models module exports", "role": "Index" }
		},
		"pages": {
			"home": {
				"components": {
					"Sidebar.tsx": { "desc": "Home page sidebar", "role": "View" },
					"index.ts": { "desc": "Home components exports", "role": "Index" }
				},
				"index.tsx": { "desc": "Home page main view", "role": "Page" },
				"types.ts": { "desc": "Home page types", "role": "Type" }
			}
		},
		"presets": {
			"index.ts": { "desc": "Presets module exports", "role": "Index" },
			"mobx.ts": { "desc": "MobX configuration preset", "role": "Config" },
			"window.ts": { "desc": "Window behavior presets", "role": "Config" }
		},
		"settings": {
			"components": {
				"Item.tsx": { "desc": "Settings item component", "role": "Component" },
				"index.ts": { "desc": "Settings components exports", "role": "Index" }
			},
			"index.tsx": { "desc": "Settings page main view", "role": "Page" }
		},
		"styles": {
			"global.css": { "desc": "Global CSS styles", "role": "Style" },
			"index.css": { "desc": "Main CSS entry", "role": "Style" },
			"md.module.css": { "desc": "Markdown specific styles", "role": "Style" },
			"vars.css": { "desc": "CSS variables definition", "role": "Style" }
		},
		"svgs": { "bare.svg": { "desc": "Bare SVG asset", "role": "Asset" } },
		"theme": {
			"antd.ts": { "desc": "Ant Design theme configuration", "role": "Config" },
			"index.ts": { "desc": "Theme module exports", "role": "Index" }
		},
		"types": {
			"app.ts": { "desc": "App domain types", "role": "Type" },
			"dayjs.ts": { "desc": "Day.js type extensions", "role": "Type" },
			"index.ts": { "desc": "Types module exports", "role": "Index" },
			"utils.ts": { "desc": "Utility types", "role": "Type" }
		},
		"typings": {
			"global.d.ts": { "desc": "Global TS declarations", "role": "Type" },
			"i18n.d.ts": { "desc": "i18n TS declarations", "role": "Type" },
			"index.d.ts": { "desc": "Index TS declarations", "role": "Type" },
			"react.d.ts": { "desc": "React TS declarations", "role": "Type" }
		},
		"utils": {
			"PrefixMap.ts": { "desc": "Prefix map utility", "role": "Utility" },
			"antd.ts": { "desc": "Ant Design utilities", "role": "Utility" },
			"capitalizeFirst.ts": { "desc": "String capitalization utility", "role": "Utility" },
			"checkParent.ts": { "desc": "DOM parent check utility", "role": "Utility" },
			"clearStorage.ts": { "desc": "Storage clearing utility", "role": "Utility" },
			"conf.ts": { "desc": "App configuration utility", "role": "Utility" },
			"copy.ts": { "desc": "Clipboard copy utility", "role": "Utility" },
			"execUntil.ts": { "desc": "Execution retry utility", "role": "Utility" },
			"findParent.ts": { "desc": "DOM parent finder utility", "role": "Utility" },
			"flat.ts": { "desc": "Array flattening utility", "role": "Utility" },
			"getGlobal.ts": { "desc": "Global object accessor", "role": "Utility" },
			"getLang.ts": { "desc": "Language detection utility", "role": "Utility" },
			"getValuedObject.ts": { "desc": "Object value filter utility", "role": "Utility" },
			"hash.ts": { "desc": "Hashing utility", "role": "Utility" },
			"i18n.ts": { "desc": "i18n setup utility", "role": "Utility" },
			"index.ts": { "desc": "Utils module exports", "role": "Index" },
			"ipc.ts": { "desc": "IPC client utility", "role": "Utility" },
			"is.ts": { "desc": "Type check utilities", "role": "Utility" },
			"memo.ts": { "desc": "Memoization utility", "role": "Utility" },
			"mermaidRender.ts": { "desc": "Mermaid rendering utility", "role": "Utility" },
			"nextTick.ts": { "desc": "Next tick utility", "role": "Utility" },
			"onWheel.ts": { "desc": "Wheel event utility", "role": "Utility" },
			"relaunch.ts": { "desc": "App relaunch utility", "role": "Utility" },
			"setGlobalAnimation.ts": { "desc": "Global animation controller", "role": "Utility" },
			"shiki.ts": { "desc": "Shiki code highlighting utility", "role": "Utility" },
			"sleep.ts": { "desc": "Async sleep utility", "role": "Utility" },
			"theme.ts": { "desc": "Theme management utility", "role": "Utility" },
			"time.ts": { "desc": "Time formatting utilities", "role": "Utility" }
		},
		"package.json": { "desc": "App package configuration", "role": "Config" },
		"postcss.config.ts": { "desc": "PostCSS configuration", "role": "Config" },
		"rsbuild.config.ts": { "desc": "Rsbuild configuration", "role": "Config" },
		"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
	}
}
```

## 3. Operational Guidelines

- **IPC Communication**: Use `packages/erpc` for main/renderer communication
- **Shared Logic**: Place reusable utilities in `packages/stk` rather than local `utils/`
