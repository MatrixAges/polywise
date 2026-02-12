# Agent Map

This document provides an overview of the packages/4xbench module structure and architecture.

## 1. Module Overview

- **Description**: 4xBench web application.
- **Architecture**: React + Rsbuild.

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/4xbench",
	"structure": {
		"src": {
			"index.tsx": { "desc": "Main entry point", "role": "Index" }
		},
		"public": {
			"index.html": { "desc": "HTML template", "role": "Asset" }
		},
		"config": {
			"package.json": { "desc": "Package configuration", "role": "Config" },
			"rsbuild.config.ts": { "desc": "Rsbuild configuration", "role": "Config" }
		}
	}
}
```

## 3. Operational Guidelines

- **Run**: Use `npm run dev` to start the development server.
