# Agent Map

This document is the outline-level map and code-style routing table for `packages/desktop`. It highlights stable responsibility boundaries for the Electron shell.

## 1. Module Overview

- **Description**: Electron main-process and packaging package for Polywise.
- **Architecture**: Electron + Rslib + desktop RPC bridge.

## 2. Outline Tree

```json
{
	"entry": [
		"package.json",
		"rslib.config.ts",
		"electron-builder.ts",
		"tsconfig.json",
		"README.md",
		"test_build.sh"
	],
	"build_and_packaging": {
		"build": "Package-local build and release preparation scripts.",
		"scripts": "Development, preload, and native rebuild helpers.",
		"metadata": "Packaging metadata such as entitlements.",
		"public": "Desktop static assets such as icons, tray assets, and loading page."
	},
	"main_process_runtime": {
		"src/index.ts": "Main-process bootstrap entry.",
		"src/config.ts": "Desktop runtime configuration entry.",
		"src/app": "Window, menu, and tray lifecycle controllers.",
		"src/rpc": {
			"app": "Renderer-facing desktop operations such as update, relaunch, install, and theme/window controls.",
			"memory": "Bridge into Polywise memory/runtime capabilities."
		},
		"src/utils": "Electron, filesystem, protocol, request, and runtime helper layer.",
		"src/locales": "Desktop locale resources.",
		"src/types": "Shared desktop-side types."
	},
	"supporting_types": {
		"typings": "Ambient declarations used by build and runtime."
	}
}
```

## 3. Code Style Routing

This routing table is scoped to outline-level folder matching. Match by `path_scope` with longest-prefix wins.

```json
{
	"package root": {
		"path_scope": "packages/desktop",
		"sample_pool": ["packages/desktop/package.json", "packages/desktop/rslib.config.ts"]
	},
	"build": {
		"path_scope": "packages/desktop/build",
		"sample_pool": ["packages/desktop/build/clean.ts", "packages/desktop/build/transform.ts"]
	},
	"scripts": {
		"path_scope": "packages/desktop/scripts",
		"sample_pool": ["packages/desktop/scripts/dev.ts", "packages/desktop/scripts/preload.ts"]
	},
	"src root": {
		"path_scope": "packages/desktop/src",
		"sample_pool": ["packages/desktop/src/index.ts", "packages/desktop/src/config.ts"]
	},
	"src/app": {
		"path_scope": "packages/desktop/src/app",
		"sample_pool": ["packages/desktop/src/app/Main.ts", "packages/desktop/src/app/Tray.ts"]
	},
	"src/locales": {
		"path_scope": "packages/desktop/src/locales",
		"sample_pool": ["packages/desktop/src/locales/en/index.ts", "packages/desktop/src/locales/zh-cn/index.ts"]
	},
	"src/rpc": {
		"path_scope": "packages/desktop/src/rpc",
		"sample_pool": ["packages/desktop/src/rpc/index.ts", "packages/desktop/src/rpc/app/index.ts"]
	},
	"src/types": {
		"path_scope": "packages/desktop/src/types",
		"sample_pool": ["packages/desktop/src/types/index.ts", "packages/desktop/src/types/hono.ts"]
	},
	"src/utils": {
		"path_scope": "packages/desktop/src/utils",
		"sample_pool": ["packages/desktop/src/utils/path.ts", "packages/desktop/src/utils/trpc.ts"]
	}
}
```

## 4. Notes

- Generated or transient directories such as `dist`, `release`, `node_modules`, `.tmp`, and `.turbo` are intentionally omitted.
- Add deeper nodes only when a new long-lived runtime domain appears under `src`.
- Keep routes at package-domain granularity. Do not reintroduce nodes for incidental subfolders unless they become stable style domains.
- `src/rpc/memory` and similar folders should inherit from their parent route unless they diverge in a durable, package-wide way.
