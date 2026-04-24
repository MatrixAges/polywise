# Code Style Routing (packages/erpc)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"src/main": {
		"path_scope": "packages/erpc/src/main",
		"sample_pool": ["packages/erpc/src/main/exposeERPC.ts", "packages/erpc/src/main/utils.ts"]
	},
	"src/renderer": {
		"path_scope": "packages/erpc/src/renderer",
		"sample_pool": ["packages/erpc/src/renderer/index.ts", "packages/erpc/src/types.ts"]
	},
	"src/vendor/unpromise": {
		"path_scope": "packages/erpc/src/vendor/unpromise",
		"sample_pool": [
			"packages/erpc/src/vendor/unpromise/types.ts",
			"packages/erpc/src/vendor/unpromise/ATTRIBUTION.txt"
		]
	},
	"src root contracts": {
		"path_scope": "packages/erpc/src",
		"sample_pool": ["packages/erpc/src/main/types.ts", "packages/erpc/src/main/index.ts"]
	}
}
```
