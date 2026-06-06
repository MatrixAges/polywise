# Agent Map

This document is the outline-level map and code-style routing table for `packages/app`. It tracks stable package responsibilities rather than every component leaf.

## 1. Module Overview

- **Description**: React renderer package for Polywise application surfaces.
- **Architecture**: Rsbuild + React + MobX + typed RPC client utilities.

## 2. Outline Tree

```json
{
	"entry": ["index.tsx", "package.json", "rsbuild.config.ts", "postcss.config.ts", "tsconfig.json"],
	"shell_and_bootstrap": {
		"appdata": "App-level route, icon, panel, and settings metadata.",
		"runtime": "Bootstrap and page bridge glue for mounting renderer pages.",
		"layout": "Shared application frame and top-level layout pieces.",
		"context": "Global React context entry points.",
		"presets": "Runtime presets for MobX, Day.js, and window integration."
	},
	"ui_surface": {
		"components": "Shared renderer components, including editor, session, drawer, and file-tree building blocks.",
		"pages": {
			"home": "Workspace and landing surface.",
			"session": "Session-centric working surface.",
			"agent": "Agent management surface.",
			"post": "Post editing and detail surface.",
			"todo": "Task board and detail surface.",
			"linkcase": "Linkcase browsing and curation surface.",
			"article": "Article detail routes.",
			"login": "Authentication entry."
		},
		"panel": "Auxiliary panel UI mounted outside the main page flow.",
		"setting": "Settings workspace for providers, models, MCP, IM, and general preferences."
	},
	"state_and_shared_logic": {
		"models": "MobX stores and shared view-model state.",
		"hooks": "Reusable renderer hooks.",
		"utils": "Client-side helpers for RPC, theme, i18n, files, and browser integration.",
		"types": "Shared frontend types.",
		"typings": "Ambient type declarations."
	},
	"assets_and_content": {
		"locales": "Application i18n dictionaries and Day.js locale wiring.",
		"styles": "Global, editor, markdown, and component stylesheet entry points.",
		"public": "Static assets shipped with the renderer.",
		"scripts": "Package-local maintenance scripts."
	}
}
```

## 3. Code Style Routing

This routing table is scoped to outline-level folder matching. Match by `path_scope` with longest-prefix wins.

```json
{
	"package root": {
		"path_scope": "packages/app",
		"sample_pool": ["packages/app/package.json", "packages/app/rsbuild.config.ts"]
	},
	"appdata": {
		"path_scope": "packages/app/appdata",
		"sample_pool": ["packages/app/appdata/app.tsx", "packages/app/appdata/panel.tsx"]
	},
	"components": {
		"path_scope": "packages/app/components",
		"sample_pool": ["packages/app/components/Session/index.tsx", "packages/app/components/Tooltip.tsx"]
	},
	"context": {
		"path_scope": "packages/app/context",
		"sample_pool": ["packages/app/context/global.ts", "packages/app/context/index.ts"]
	},
	"hooks": {
		"path_scope": "packages/app/hooks",
		"sample_pool": ["packages/app/hooks/useForm.ts", "packages/app/hooks/useTheme.ts"]
	},
	"layout": {
		"path_scope": "packages/app/layout",
		"sample_pool": ["packages/app/layout/index.tsx", "packages/app/layout/types.ts"]
	},
	"locales": {
		"path_scope": "packages/app/locales",
		"sample_pool": ["packages/app/locales/index.ts", "packages/app/locales/dayjs/en.ts"]
	},
	"models": {
		"path_scope": "packages/app/models",
		"sample_pool": ["packages/app/models/global.ts", "packages/app/models/theme.ts"]
	},
	"pages": {
		"path_scope": "packages/app/pages",
		"sample_pool": ["packages/app/pages/home/index.tsx", "packages/app/pages/session/index.tsx"]
	},
	"panel": {
		"path_scope": "packages/app/panel",
		"sample_pool": ["packages/app/panel/index.tsx", "packages/app/panel/model.ts"]
	},
	"runtime": {
		"path_scope": "packages/app/runtime",
		"sample_pool": ["packages/app/runtime/AppRoot.tsx", "packages/app/runtime/PageBridge.tsx"]
	},
	"setting": {
		"path_scope": "packages/app/setting",
		"sample_pool": ["packages/app/setting/index.tsx", "packages/app/setting/model_provider/index.tsx"]
	},
	"utils": {
		"path_scope": "packages/app/utils",
		"sample_pool": ["packages/app/utils/ipc.ts", "packages/app/utils/theme.ts"]
	}
}
```

## 4. Notes

- Generated or transient directories such as `dist`, `node_modules`, `.turbo`, and protected `__*` folders are intentionally omitted.
- Expand this map only when a new responsibility boundary or stable business domain appears.
- Keep routes at package-domain granularity. Do not add nodes for routine component leaves or single page folders unless they become long-lived style islands.
- Add a deeper route only when a subdomain has a clearly distinct structure that is reused across multiple edits.
