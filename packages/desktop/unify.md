# Code Style Routing (packages/desktop)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"src/app": {
		"path_scope": "packages/desktop/src/app",
		"sample_pool": ["packages/desktop/src/app/Tray.ts", "packages/desktop/src/app/index.ts"]
	},
	"src/rpc/app": {
		"path_scope": "packages/desktop/src/rpc/app",
		"sample_pool": ["packages/desktop/src/rpc/app/checkUpdate.ts", "packages/desktop/src/rpc/app/onMain.ts"]
	},
	"src/rpc/memory": {
		"path_scope": "packages/desktop/src/rpc/memory",
		"sample_pool": [
			"packages/desktop/src/utils/trpc.ts",
			"packages/desktop/src/utils/saveWithUtilityProcess/index.ts"
		]
	},
	"src/rpc root": {
		"path_scope": "packages/desktop/src/rpc",
		"sample_pool": ["packages/desktop/src/rpc/memory/index.ts", "packages/desktop/src/utils/trpc.ts"]
	},
	"src/utils": {
		"path_scope": "packages/desktop/src/utils",
		"sample_pool": ["packages/desktop/src/utils/serve.ts", "packages/desktop/src/utils/path.ts"]
	},
	"src/api": {
		"path_scope": "packages/desktop/src/api",
		"sample_pool": ["packages/desktop/src/utils/serve.ts", "packages/desktop/src/rpc/index.ts"]
	},
	"src/locales": {
		"path_scope": "packages/desktop/src/locales",
		"sample_pool": ["packages/desktop/src/locales/en/global.ts", "packages/desktop/src/locales/zh-cn/global.ts"]
	}
}
```
