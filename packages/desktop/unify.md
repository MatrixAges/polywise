# Code Style Routing (packages/desktop)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"src/app": {
		"path_scope": "packages/desktop/src/app",
		"description": "Main-process window/menu/tray controllers and app-level orchestration.",
		"fractal_rule": "Keep one controller per file and aggregate with `app/index.ts`.",
		"import_order": "1) electron/third-party libs; 2) @desktop aliases; 3) relative modules; 4) type-only imports.",
		"naming_rules": "Controller class files use PascalCase; methods use camelCase; variables use snake_case.",
		"Same Code 1": "packages/desktop/src/app/Main.ts",
		"Same Code 2": "packages/desktop/src/app/Menu.ts",
		"sample_pool": ["packages/desktop/src/app/Tray.ts", "packages/desktop/src/app/index.ts"]
	},
	"src/rpc/app": {
		"path_scope": "packages/desktop/src/rpc/app",
		"description": "App-domain RPC procedures and domain router composition.",
		"fractal_rule": "Keep one procedure per file and combine them in folder `index.ts`.",
		"import_order": "1) @desktop/utils; 2) local procedure modules; 3) type-only imports.",
		"naming_rules": "Procedure files use camelCase and export default procedure/router values.",
		"Same Code 1": "packages/desktop/src/rpc/app/index.ts",
		"Same Code 2": "packages/desktop/src/rpc/app/actions.ts",
		"sample_pool": ["packages/desktop/src/rpc/app/checkUpdate.ts", "packages/desktop/src/rpc/app/onMain.ts"]
	},
	"src/rpc/memory": {
		"path_scope": "packages/desktop/src/rpc/memory",
		"description": "Memory bridge RPC endpoint wired to utility-process implementation.",
		"fractal_rule": "Keep as minimal index entry unless multiple memory procedures emerge.",
		"import_order": "1) @desktop aliases; 2) local dependencies; 3) type-only imports.",
		"naming_rules": "Use lower-case folder and index entry for domain consistency.",
		"Same Code 1": "packages/desktop/src/rpc/memory/index.ts",
		"Same Code 2": "packages/desktop/src/rpc/index.ts",
		"sample_pool": [
			"packages/desktop/src/utils/trpc.ts",
			"packages/desktop/src/utils/saveWithUtilityProcess/index.ts"
		]
	},
	"src/rpc root": {
		"path_scope": "packages/desktop/src/rpc",
		"description": "RPC root router and domain mounting.",
		"fractal_rule": "Keep root `index.ts` as mount-only aggregator; domain logic lives in subfolders.",
		"import_order": "1) @desktop aliases; 2) domain routers; 3) type-only imports.",
		"naming_rules": "Root router entry is `index.ts`.",
		"Same Code 1": "packages/desktop/src/rpc/index.ts",
		"Same Code 2": "packages/desktop/src/rpc/app/index.ts",
		"sample_pool": ["packages/desktop/src/rpc/memory/index.ts", "packages/desktop/src/utils/trpc.ts"]
	},
	"src/utils/saveWithUtilityProcess": {
		"path_scope": "packages/desktop/src/utils/saveWithUtilityProcess",
		"description": "Utility-process bridge for polywise memory operations and lifecycle.",
		"fractal_rule": "Keep orchestration in folder `index.ts` and worker bridge internals in dedicated sibling files.",
		"import_order": "1) electron/node/third-party libs; 2) @desktop aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Bridge helpers use camelCase. File names follow existing mixed style for compatibility.",
		"Same Code 1": "packages/desktop/src/utils/saveWithUtilityProcess/index.ts",
		"Same Code 2": "packages/desktop/src/utils/saveWithUtilityProcess/polywise.ts",
		"sample_pool": ["packages/desktop/src/workers/polywise.ts", "packages/desktop/src/utils/task.ts"]
	},
	"src/utils": {
		"path_scope": "packages/desktop/src/utils",
		"description": "General desktop utility modules (trpc, fs, serve, protocol, locale, etc.).",
		"fractal_rule": "Keep utility atoms in single files; split to subfolder when a capability has multiple files.",
		"import_order": "1) Node/third-party libs; 2) @desktop aliases; 3) relative modules; 4) type-only imports.",
		"naming_rules": "Functions use camelCase. Types use PascalCase. Variables use snake_case.",
		"Same Code 1": "packages/desktop/src/utils/trpc.ts",
		"Same Code 2": "packages/desktop/src/utils/fs.ts",
		"sample_pool": ["packages/desktop/src/utils/serve.ts", "packages/desktop/src/utils/path.ts"]
	},
	"src/api": {
		"path_scope": "packages/desktop/src/api",
		"description": "Desktop-side API router exposure layer.",
		"fractal_rule": "Keep API domain facade thin and route-heavy logic outside this folder.",
		"import_order": "1) third-party server libs; 2) @desktop aliases; 3) local files; 4) type-only imports.",
		"naming_rules": "Use `index.ts` as API entry and keep exported symbols explicit.",
		"Same Code 1": "packages/desktop/src/api/index.ts",
		"Same Code 2": "packages/desktop/src/index.ts",
		"sample_pool": ["packages/desktop/src/utils/serve.ts", "packages/desktop/src/rpc/index.ts"]
	},
	"src/locales": {
		"path_scope": "packages/desktop/src/locales",
		"description": "Desktop locale dictionaries grouped by language.",
		"fractal_rule": "One folder per locale with `index.ts` entry and language-specific dictionaries.",
		"import_order": "1) local locale files; 2) third-party locale utilities if needed; 3) type-only imports.",
		"naming_rules": "Locale folder naming follows existing lower/kebab naming.",
		"Same Code 1": "packages/desktop/src/locales/en/index.ts",
		"Same Code 2": "packages/desktop/src/locales/zh-cn/index.ts",
		"sample_pool": ["packages/desktop/src/locales/en/global.ts", "packages/desktop/src/locales/zh-cn/global.ts"]
	}
}
```
