# Agent Map

This document provides an overview of the packages/cli module structure and architecture.

## 1. Module Overview

- **Description**: CLI tool for Polywise.
- **Architecture**: Commander + Rslib.

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/cli",
	"structure": {
		"src": {
			"index.ts": { "desc": "Main entry point with checkModels and serve commands", "role": "Index" },
			"server.ts": { "desc": "Polywise server implementation using Hono", "role": "Server" },
			"types.ts": { "desc": "CLI and server types", "role": "Type" }
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

- **Build**: Use `npm run build` to build the CLI tool.
