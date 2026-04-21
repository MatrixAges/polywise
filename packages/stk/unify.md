# Code Style Routing (packages/stk)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"src/utils": {
		"path_scope": "packages/stk/src/utils",
		"description": "General-purpose utility atoms shared across packages.",
		"fractal_rule": "Keep one utility per file and aggregate with `src/utils/index.ts`.",
		"import_order": "1) third-party libs; 2) local sibling imports; 3) type-only imports.",
		"naming_rules": "Keep existing package naming conventions (camelCase/PascalCase mix where established).",
		"Same Code 1": "packages/stk/src/utils/getId.ts",
		"Same Code 2": "packages/stk/src/utils/uniqBy.ts",
		"sample_pool": ["packages/stk/src/utils/nextTick.ts", "packages/stk/src/utils/index.ts"]
	},
	"src/mobx": {
		"path_scope": "packages/stk/src/mobx",
		"description": "MobX-oriented helpers for observation and storage synchronization.",
		"fractal_rule": "Keep helper functions single-purpose and expose via `src/mobx/index.ts`.",
		"import_order": "1) mobx/third-party libs; 2) local storage/helpers; 3) type-only imports.",
		"naming_rules": "Functions use camelCase. Interfaces/types use PascalCase. Variables use snake_case where established.",
		"Same Code 1": "packages/stk/src/mobx/setStoreWhenChange.ts",
		"Same Code 2": "packages/stk/src/mobx/setStorageWhenChange.ts",
		"sample_pool": ["packages/stk/src/mobx/copy.ts", "packages/stk/src/mobx/index.ts"]
	},
	"src/react": {
		"path_scope": "packages/stk/src/react",
		"description": "React helper hooks and abstractions used by frontend packages.",
		"fractal_rule": "Keep one hook/helper per file and compose exports in `src/react/index.ts`.",
		"import_order": "1) react ecosystem libs; 2) local helper imports; 3) type-only imports.",
		"naming_rules": "Hooks start with `use`. Helper names follow camelCase/PascalCase existing usage.",
		"Same Code 1": "packages/stk/src/react/useSelection.ts",
		"Same Code 2": "packages/stk/src/react/useDeepMemo.ts",
		"sample_pool": ["packages/stk/src/react/createDeepCompareEffect.ts", "packages/stk/src/react/index.ts"]
	},
	"src/storage/extends": {
		"path_scope": "packages/stk/src/storage/extends",
		"description": "Storage extension helpers layered on top of base storage abstraction.",
		"fractal_rule": "Keep each extension behavior as one file and mount from storage root index.",
		"import_order": "1) third-party libs; 2) local storage helpers; 3) type-only imports.",
		"naming_rules": "Extension files use camelCase and describe behavior clearly.",
		"Same Code 1": "packages/stk/src/storage/extends/watch.ts",
		"Same Code 2": "packages/stk/src/storage/extends/expires.ts",
		"sample_pool": ["packages/stk/src/storage/index.ts", "packages/stk/src/storage/shared.ts"]
	},
	"src/storage/proxy": {
		"path_scope": "packages/stk/src/storage/proxy",
		"description": "Storage proxy and transform internals.",
		"fractal_rule": "Keep proxy concerns split by target type and expose through storage root.",
		"import_order": "1) third-party libs; 2) local proxy/shared modules; 3) type-only imports.",
		"naming_rules": "Proxy files use concise lower camel names aligned with data target.",
		"Same Code 1": "packages/stk/src/storage/proxy/storage.ts",
		"Same Code 2": "packages/stk/src/storage/proxy/object.ts",
		"sample_pool": ["packages/stk/src/storage/proxy/transform.ts", "packages/stk/src/storage/index.ts"]
	},
	"src/storage": {
		"path_scope": "packages/stk/src/storage",
		"description": "Storage abstraction root, shared helpers, and package exports.",
		"fractal_rule": "Root storage entry composes proxy and extension subfolders without embedding app business logic.",
		"import_order": "1) third-party libs; 2) local storage modules; 3) type-only imports.",
		"naming_rules": "Files mostly use camelCase. Type declarations keep package existing naming.",
		"Same Code 1": "packages/stk/src/storage/index.ts",
		"Same Code 2": "packages/stk/src/storage/utils.ts",
		"sample_pool": ["packages/stk/src/storage/shared.ts", "packages/stk/src/storage/typings.d.ts"]
	},
	"src/emittery": {
		"path_scope": "packages/stk/src/emittery",
		"description": "Vendored emitter implementation and mapping/types glue.",
		"fractal_rule": "Keep this folder isolated and expose stable APIs via index.",
		"import_order": "1) local vendor imports; 2) type-only imports.",
		"naming_rules": "Preserve existing vendor-compatible naming.",
		"Same Code 1": "packages/stk/src/emittery/index.ts",
		"Same Code 2": "packages/stk/src/emittery/maps.ts",
		"sample_pool": ["packages/stk/src/emittery/types.ts", "packages/stk/src/emittery/readme.md"]
	}
}
```
