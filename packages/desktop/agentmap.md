# Agent Map

This document is an outline-level map of `packages/desktop`. It highlights stable responsibility boundaries for the Electron shell.

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

## 3. Notes

- Generated or transient directories such as `dist`, `release`, `node_modules`, `.tmp`, and `.turbo` are intentionally omitted.
- Add deeper nodes only when a new long-lived runtime domain appears under `src`.
