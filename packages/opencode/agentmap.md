# Agent Map

This document provides an overview of the packages/opencode module structure and architecture.

## 1. Module Overview

- **Description**: OpenCode agent package.
- **Architecture**: Rslib.

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/opencode",
	"structure": {
		"src": {
			"index.ts": { "desc": "Main entry point", "role": "Index" }
		},
		"config": {
			"package.json": { "desc": "Package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		}
	}
}
```

## 3. Operational Guidelines

- **Build**: Use `npm run build`.
