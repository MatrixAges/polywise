# Code Style Routing (packages/erpc)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"src/main": {
		"path_scope": "packages/erpc/src/main",
		"description": "Main-process IPC handler creation, dispatch, and subscription lifecycle.",
		"fractal_rule": "Keep one atomic responsibility per file and compose through `src/main/index.ts`.",
		"import_order": "1) third-party libs; 2) shared ../ constants/types; 3) local helpers; 4) type-only imports.",
		"naming_rules": "Factories/helpers use camelCase. Internal classes use PascalCase. Variables use snake_case.",
		"Same Code 1": "packages/erpc/src/main/createIPCHandler.ts",
		"Same Code 2": "packages/erpc/src/main/handleIPCMessage.ts",
		"sample_pool": ["packages/erpc/src/main/exposeERPC.ts", "packages/erpc/src/main/utils.ts"]
	},
	"src/renderer": {
		"path_scope": "packages/erpc/src/renderer",
		"description": "Renderer-side tRPC IPC link and response transformation utilities.",
		"fractal_rule": "Use one transport link entry and a small set of nearby utility files.",
		"import_order": "1) @trpc/third-party libs; 2) local renderer helpers; 3) shared types; 4) type-only imports.",
		"naming_rules": "Files and functions use camelCase. Type aliases/interfaces use PascalCase.",
		"Same Code 1": "packages/erpc/src/renderer/ipcLink.ts",
		"Same Code 2": "packages/erpc/src/renderer/utils.ts",
		"sample_pool": ["packages/erpc/src/renderer/index.ts", "packages/erpc/src/types.ts"]
	},
	"src/vendor/unpromise": {
		"path_scope": "packages/erpc/src/vendor/unpromise",
		"description": "Vendored unpromise runtime and type definitions.",
		"fractal_rule": "Keep vendor code isolated from project business logic and expose through local index.",
		"import_order": "1) local vendor modules; 2) type-only imports.",
		"naming_rules": "Preserve upstream-compatible naming where required.",
		"Same Code 1": "packages/erpc/src/vendor/unpromise/index.ts",
		"Same Code 2": "packages/erpc/src/vendor/unpromise/unpromise.ts",
		"sample_pool": [
			"packages/erpc/src/vendor/unpromise/types.ts",
			"packages/erpc/src/vendor/unpromise/ATTRIBUTION.txt"
		]
	},
	"src root contracts": {
		"path_scope": "packages/erpc/src",
		"description": "Shared protocol constants and cross-process type contracts.",
		"fractal_rule": "Keep root contracts atomic and side-effect free.",
		"import_order": "1) external type libs if needed; 2) local imports; 3) type-only imports.",
		"naming_rules": "Constants use SCREAMING_SNAKE_CASE. Types use PascalCase.",
		"Same Code 1": "packages/erpc/src/constants.ts",
		"Same Code 2": "packages/erpc/src/types.ts",
		"sample_pool": ["packages/erpc/src/main/types.ts", "packages/erpc/src/main/index.ts"]
	}
}
```
