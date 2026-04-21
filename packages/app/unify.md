# Code Style Routing (packages/app)

This file constrains code generation and refactoring behavior for `packages/app`. Before any write operation, the agent must match a node from the Tree JSON below and complete two-sample comparison.

## Tree JSON Routing Table

```json
{
	"React Pages and Composite Components": {
		"description": "Handles page-level and complex composite UI rendering. Child composition is allowed, but business state ownership stays in page models.",
		"fractal_rule": "A single file can host the entry. When stable sections appear, use same-name folder + index.tsx + components/ layering to avoid flat directory sprawl.",
		"import_order": "1) react/mobx/tsyringe and third-party libs; 2) @/ internal aliases; 3) relative modules; 4) type-only imports at the end of each group.",
		"naming_rules": "Component files use PascalCase. Functions/events use camelCase. Ordinary variables use snake_case.",
		"Same Code 1": "packages/app/components/Session/index.tsx",
		"Same Code 2": "packages/app/pages/session/index.tsx",
		"sample_pool": [
			"packages/app/components/Dialog.tsx",
			"packages/app/pages/project/index.tsx",
			"packages/app/pages/session/components/Menu/index.tsx"
		]
	},
	"MobX Models": {
		"description": "Owns state organization, async orchestration, subscriptions, and lifecycle. Must not contain JSX.",
		"fractal_rule": "Prefer single-file models. When one model becomes heavy, create a same-level folder and split by capability with index as the aggregator.",
		"import_order": "1) mobx/tsyringe; 2) @/models and @/utils; 3) relative paths; 4) type-only imports.",
		"naming_rules": "Class names use PascalCase with Model suffix. Methods use camelCase. Fields use snake_case.",
		"Same Code 1": "packages/app/models/global.ts",
		"Same Code 2": "packages/app/models/setting.ts",
		"sample_pool": ["packages/app/models/theme.ts", "packages/app/models/locale.ts"]
	},
	"Frontend Utility Functions": {
		"description": "Provides lightweight non-UI reusable capabilities and must avoid page-state side effects.",
		"fractal_rule": "Place by capability in utils/. If a capability has multiple sub-implementations, create a same-name folder with index.ts entry.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) relative paths; 4) type-only imports.",
		"naming_rules": "Functions use camelCase, ordinary variables use snake_case, and file names follow current repo style (mostly camelCase).",
		"Same Code 1": "packages/app/utils/time.ts",
		"Same Code 2": "packages/app/utils/i18n.ts",
		"sample_pool": ["packages/app/utils/ipc.ts", "packages/app/utils/theme.ts"]
	}
}
```
