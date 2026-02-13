# Agent Map

This document provides an overview of the packages/fst module structure and architecture.

## 1. Module Overview

- **Description**: Finite State Transducer package
- **Architecture**: TypeScript

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/fst",
	"structure": {
		"src": {
			"index.ts": { "desc": "Main entry point", "role": "Index" }
		},
		"scripts": {
			"desc": "Maintenance and utility scripts"
		},
		"test": {
			"desc": "Functional and integration tests"
		},
		"config": {
			"package.json": { "desc": "Package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" },
			"agentmap.md": { "desc": "Module overview and architecture", "role": "Docs" },
			"README.md": { "desc": "Project documentation (English)", "role": "Docs" },
			"README.zh.md": { "desc": "Project documentation (Chinese)", "role": "Docs" }
		}
	}
}
```

## 3. Operational Guidelines

- **TDD**: Follow TDD principles for new features
