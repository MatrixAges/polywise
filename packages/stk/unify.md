# Code Style Routing (packages/stk)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
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
	"src/storage/extends": {
		"path_scope": "packages/stk/src/storage/extends",
		"sample_pool": ["packages/stk/src/storage/index.ts", "packages/stk/src/storage/shared.ts"]
	},
	"src/storage/proxy": {
		"path_scope": "packages/stk/src/storage/proxy",
		"sample_pool": ["packages/stk/src/storage/proxy/transform.ts", "packages/stk/src/storage/index.ts"]
	},
	"src/storage": {
		"path_scope": "packages/stk/src/storage",
		"sample_pool": ["packages/stk/src/storage/shared.ts", "packages/stk/src/storage/typings.d.ts"]
	},
	"src/emittery": {
		"path_scope": "packages/stk/src/emittery",
		"sample_pool": ["packages/stk/src/emittery/types.ts", "packages/stk/src/emittery/readme.md"]
	}
}
```
