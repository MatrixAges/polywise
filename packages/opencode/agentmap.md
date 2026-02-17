# Agent Map

This document provides an overview of the packages/opencode module structure and architecture.

## 1. Module Overview

- **Description**: OpenCode agent package - Polywise Plugin.
- **Architecture**: Rslib.

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/opencode",
	"structure": {
		"src": {
			"index.ts": { "desc": "Main entry point exporting plugin", "role": "Index" },
			"plugin.ts": { "desc": "OpencodePolywisePlugin implementation", "role": "Plugin" }
		},
		"config": {
			"package.json": { "desc": "Package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		},
		"README.md": { "desc": "Plugin documentation", "role": "Doc" },
		"README_zh.md": { "desc": "Chinese Plugin documentation", "role": "Doc" }
	}
}
```

## 3. Operational Guidelines

- **Build**: Use `npm run build`.
- **Plugin**: Implements `OpencodePolywisePlugin` which hooks into `tui.prompt.append` and `session.idle` events.
