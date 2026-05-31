# Agent Map

This document is an outline-level map of `packages/app`. It tracks stable package responsibilities rather than every component leaf.

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

## 3. Notes

- Generated or transient directories such as `dist`, `node_modules`, `.turbo`, and protected `__*` folders are intentionally omitted.
- Expand this map only when a new responsibility boundary or stable business domain appears.
