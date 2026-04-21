# Code Style Routing (packages/erpc)

This file defines code style routing for the `packages/erpc` IPC library. Any code write must match a node and follow dual-sample imitation.

## Tree JSON Routing Table

```json
{
	"Main Process IPC Layer": {
		"description": "Implements IPC handler creation, message dispatching, and subscription lifecycle management on Electron main process.",
		"fractal_rule": "Keep core entry files atomic in src/main/. If logic grows beyond one concern, split into adjacent helpers and keep one primary orchestration file.",
		"import_order": "1) third-party libs (@trpc/electron); 2) ../ shared constants/types; 3) ./ local helpers; 4) type-only imports at the tail.",
		"naming_rules": "Factory/helper functions use camelCase. Internal classes use PascalCase. Ordinary variables use snake_case.",
		"Same Code 1": "packages/erpc/src/main/createIPCHandler.ts",
		"Same Code 2": "packages/erpc/src/main/handleIPCMessage.ts",
		"sample_pool": ["packages/erpc/src/main/utils.ts", "packages/erpc/src/main/index.ts"]
	},
	"Renderer IPC Link Layer": {
		"description": "Builds renderer-side transport link and response adaptation for tRPC over Electron IPC.",
		"fractal_rule": "Keep renderer entry in src/renderer/ with one main link file and lightweight utility companions.",
		"import_order": "1) @trpc imports; 2) local renderer utilities; 3) shared type imports; 4) type-only imports.",
		"naming_rules": "Files and functions use camelCase. Types use PascalCase. Generic type aliases are concise and domain-specific.",
		"Same Code 1": "packages/erpc/src/renderer/ipcLink.ts",
		"Same Code 2": "packages/erpc/src/renderer/utils.ts",
		"sample_pool": ["packages/erpc/src/renderer/index.ts"]
	},
	"Shared Constants and Types": {
		"description": "Defines cross-process protocol constants and shared type contracts used by both main and renderer.",
		"fractal_rule": "Keep small atomic files in src/ root. Avoid mixing runtime behavior with pure type/constant contracts.",
		"import_order": "1) external type libs if needed; 2) local imports; 3) type-only imports.",
		"naming_rules": "Constants use SCREAMING_SNAKE_CASE. Type aliases/interfaces use PascalCase. Fields use snake_case if aligned with protocol payload.",
		"Same Code 1": "packages/erpc/src/constants.ts",
		"Same Code 2": "packages/erpc/src/types.ts",
		"sample_pool": ["packages/erpc/src/main/types.ts"]
	}
}
```
