# Agent Map

This document provides an overview of the packages/erpc module structure and architecture.

## 1. Module Overview

- **Description**: Type-safe IPC library
- **Architecture**: tRPC + Electron IPC

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/erpc",
	"structure": {
		"src": {
			"constants.ts": { "desc": "IPC Channel constants", "role": "Config" },
			"main": {
				"createIPCHandler.ts": { "desc": "IPC Handler creator", "role": "Provider" },
				"exposeERPC.ts": { "desc": "Preload exposure utility", "role": "Provider" },
				"handleIPCMessage.ts": { "desc": "Message handling logic", "role": "Internal" },
				"index.ts": { "desc": "Main process exports", "role": "Index" },
				"types.ts": { "desc": "Main process types", "role": "Type" },
				"utils.ts": { "desc": "Main process utilities", "role": "Utility" }
			},
			"renderer": {
				"index.ts": { "desc": "Renderer process exports", "role": "Index" },
				"ipcLink.ts": { "desc": "tRPC IPC Link", "role": "Consumer" },
				"utils.ts": { "desc": "Renderer utilities", "role": "Utility" }
			},
			"types.ts": { "desc": "Shared type definitions", "role": "Type" },
			"vendor": {
				"unpromise": {
					"ATTRIBUTION.txt": { "desc": "Attribution file", "role": "Doc" },
					"index.ts": { "desc": "Unpromise library exports", "role": "Index" },
					"types.ts": { "desc": "Unpromise types", "role": "Type" },
					"unpromise.ts": { "desc": "Unpromise implementation", "role": "Library" }
				}
			}
		},
		"config": {
			"package.json": { "desc": "eRPC package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		}
	}
}
```

## 3. Operational Guidelines

- **Main Process**: IPC handlers defined in `src/main/`
- **Renderer Process**: Client-side IPC in `src/renderer/`
- **Cross-process Communication**: All inter-process communication flows through this package
