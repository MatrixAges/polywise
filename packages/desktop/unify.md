# Code Style Routing (packages/desktop)

This routing table is scoped to outline-level folder matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

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

## Notes

- Keep routes at package-domain granularity. Do not reintroduce nodes for incidental subfolders unless they become stable style domains.
- `src/rpc/memory` and similar folders should inherit from their parent route unless they diverge in a durable, package-wide way.
