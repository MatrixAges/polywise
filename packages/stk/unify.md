# Code Style Routing (packages/stk)

This file defines style routing for the shared toolkit package `packages/stk`. Any write must route by node and follow the two-sample cloning rule.

## Tree JSON Routing Table

```json
{
	"General Utilities": {
		"description": "Provides cross-package utility atoms under src/utils.",
		"fractal_rule": "Keep one utility per file. Aggregate exports through src/utils/index.ts without embedding business-specific coupling.",
		"import_order": "1) third-party libs; 2) local sibling imports; 3) type-only imports.",
		"naming_rules": "Utility function files and exports follow existing camelCase/PascalCase conventions in this package.",
		"Same Code 1": "packages/stk/src/utils/getId.ts",
		"Same Code 2": "packages/stk/src/utils/uniqBy.ts",
		"sample_pool": ["packages/stk/src/utils/nextTick.ts", "packages/stk/src/utils/index.ts"]
	},
	"MobX Helpers": {
		"description": "Provides MobX-related helpers for store syncing and observation patterns.",
		"fractal_rule": "Keep helpers under src/mobx with single-purpose files; export composition via src/mobx/index.ts.",
		"import_order": "1) mobx or third-party libs; 2) local storage/helpers; 3) type-only imports.",
		"naming_rules": "Functions use camelCase. Interfaces/types use PascalCase. Keys and ordinary variables use snake_case where already established.",
		"Same Code 1": "packages/stk/src/mobx/setStoreWhenChange.ts",
		"Same Code 2": "packages/stk/src/mobx/setStorageWhenChange.ts",
		"sample_pool": ["packages/stk/src/mobx/copy.ts", "packages/stk/src/mobx/index.ts"]
	},
	"React Helpers": {
		"description": "Provides React-level utility hooks and helper abstractions.",
		"fractal_rule": "Keep hook/helper atoms in src/react. Maintain a thin barrel index for exports.",
		"import_order": "1) react ecosystem libs; 2) local helper imports; 3) type-only imports.",
		"naming_rules": "Hook files start with use*. Utility helpers use camelCase. Export names stay consistent with file names.",
		"Same Code 1": "packages/stk/src/react/useSelection.ts",
		"Same Code 2": "packages/stk/src/react/useDeepMemo.ts",
		"sample_pool": ["packages/stk/src/react/createDeepCompareEffect.ts", "packages/stk/src/react/index.ts"]
	},
	"Storage Toolkit": {
		"description": "Provides storage abstractions, extensions, and proxy adapters.",
		"fractal_rule": "Use src/storage as a bounded domain with dedicated subfolders (extends/, proxy/). Keep entry orchestration in src/storage/index.ts.",
		"import_order": "1) third-party libs; 2) local storage modules; 3) type-only imports.",
		"naming_rules": "Files use camelCase by default. Types use PascalCase. Shared constants/keys may use snake_case.",
		"Same Code 1": "packages/stk/src/storage/index.ts",
		"Same Code 2": "packages/stk/src/storage/utils.ts",
		"sample_pool": ["packages/stk/src/storage/extends/watch.ts", "packages/stk/src/storage/proxy/storage.ts"]
	},
	"Emittery Vendor Layer": {
		"description": "Contains vendored emitter implementation and related type/maps glue.",
		"fractal_rule": "Keep vendor files localized in src/emittery without leaking domain logic from other modules.",
		"import_order": "1) local vendor imports; 2) type-only imports.",
		"naming_rules": "Retain upstream-compatible naming where needed; new wrappers must follow package naming rules.",
		"Same Code 1": "packages/stk/src/emittery/index.ts",
		"Same Code 2": "packages/stk/src/emittery/maps.ts",
		"sample_pool": ["packages/stk/src/emittery/types.ts"]
	}
}
```
