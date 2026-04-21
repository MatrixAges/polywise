# Code Style Routing (packages/desktop)

This file defines style and layering constraints for `packages/desktop` (Electron main process). Any write must follow matched node routing plus dual-sample reading.

## Tree JSON Routing Table

```json
{
	"Main Process Window and App Controllers": {
		"description": "Owns BrowserWindow, menu, tray, and other Electron main-process app control logic.",
		"fractal_rule": "Use single-capability files under app/. When one controller grows heavy, upgrade to same-name directory with index.ts as export entry.",
		"import_order": "1) electron and third-party libs; 2) @desktop/* aliases; 3) relative paths; 4) type-only imports.",
		"naming_rules": "Class names use PascalCase. Methods use camelCase. Ordinary variables use snake_case.",
		"Same Code 1": "packages/desktop/src/app/Main.ts",
		"Same Code 2": "packages/desktop/src/app/Menu.ts",
		"sample_pool": ["packages/desktop/src/app/Tray.ts", "packages/desktop/src/app/index.ts"]
	},
	"RPC Routers and Procedures": {
		"description": "Defines main-process-facing tRPC router composition and atomic procedures.",
		"fractal_rule": "Split directories by domain (for example rpc/app and rpc/memory). Keep procedure files atomic.",
		"import_order": "1) @desktop/utils; 2) local relative dependencies; 3) type-only imports.",
		"naming_rules": "Use camelCase file names and export default procedures or router composition objects.",
		"Same Code 1": "packages/desktop/src/rpc/app/index.ts",
		"Same Code 2": "packages/desktop/src/rpc/app/actions.ts",
		"sample_pool": ["packages/desktop/src/rpc/app/checkUpdate.ts", "packages/desktop/src/rpc/index.ts"]
	},
	"Main Process Utility Modules": {
		"description": "Provides shared main-process utilities (file, path, service bootstrap, trpc context, etc.).",
		"fractal_rule": "Split by capability under utils/. Use subdirectories for grouped upstream/downstream capabilities (for example saveWithUtilityProcess/).",
		"import_order": "1) Node/third-party libs; 2) @desktop/* aliases; 3) relative paths; 4) type-only imports.",
		"naming_rules": "Functions use camelCase. Types use PascalCase. Ordinary variables use snake_case.",
		"Same Code 1": "packages/desktop/src/utils/trpc.ts",
		"Same Code 2": "packages/desktop/src/utils/fs.ts",
		"sample_pool": ["packages/desktop/src/utils/serve.ts", "packages/desktop/src/utils/path.ts"]
	}
}
```
