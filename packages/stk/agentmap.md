# Agent Map

This document is the outline-level map and code-style routing table for `packages/stk`. It tracks stable toolkit responsibilities and the sample routes used for coding alignment.

## 1. Module Overview

- **Description**: Shared toolkit and utility package.
- **Architecture**: Process-agnostic helper library for React, MobX, storage, and general runtime utilities.

## 2. Outline Tree

```json
{
	"entry": ["package.json", "rslib.config.ts", "tsconfig.json", "README.md", "LICENSE"],
	"shared_runtime_domains": {
		"src/utils": "General-purpose helpers for async flow, values, DOM-adjacent browser utilities, and shared collection logic.",
		"src/mobx": "MobX integration helpers and reactive utility layer.",
		"src/react": "React hooks and rendering helpers reused across packages.",
		"src/storage": "Storage abstraction, proxy handlers, extensions, and shared persistence utilities.",
		"src/emittery": "Bundled event emitter implementation and related types."
	}
}
```

## 3. Code Style Routing

This routing table is scoped to outline-level folder matching. Match by `path_scope` with longest-prefix wins.

```json
{
	"package root": {
		"path_scope": "packages/stk",
		"sample_pool": ["packages/stk/package.json", "packages/stk/rslib.config.ts"]
	},
	"src root": {
		"path_scope": "packages/stk/src",
		"sample_pool": ["packages/stk/src/utils/index.ts", "packages/stk/src/react/index.ts"]
	},
	"src/utils": {
		"path_scope": "packages/stk/src/utils",
		"sample_pool": ["packages/stk/src/utils/nextTick.ts", "packages/stk/src/utils/index.ts"]
	},
	"src/mobx": {
		"path_scope": "packages/stk/src/mobx",
		"sample_pool": ["packages/stk/src/mobx/copy.ts", "packages/stk/src/mobx/index.ts"]
	},
	"src/react": {
		"path_scope": "packages/stk/src/react",
		"sample_pool": ["packages/stk/src/react/createDeepCompareEffect.ts", "packages/stk/src/react/index.ts"]
	},
	"src/storage": {
		"path_scope": "packages/stk/src/storage",
		"sample_pool": ["packages/stk/src/storage/index.ts", "packages/stk/src/storage/shared.ts"]
	},
	"src/storage/extends": {
		"path_scope": "packages/stk/src/storage/extends",
		"sample_pool": ["packages/stk/src/storage/extends/expires.ts", "packages/stk/src/storage/extends/watch.ts"]
	},
	"src/storage/proxy": {
		"path_scope": "packages/stk/src/storage/proxy",
		"sample_pool": ["packages/stk/src/storage/proxy/transform.ts", "packages/stk/src/storage/proxy/storage.ts"]
	},
	"src/emittery": {
		"path_scope": "packages/stk/src/emittery",
		"sample_pool": ["packages/stk/src/emittery/index.ts", "packages/stk/src/emittery/types.ts"]
	}
}
```

## 4. Notes

- Generated or transient directories such as `dist`, `node_modules`, `.turbo`, and protected `__*` folders are intentionally omitted.
- Keep the map at package and domain granularity. Do not expand routine utility leaves beyond public entry files and stable coordination roots.
