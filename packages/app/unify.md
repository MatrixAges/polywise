# Code Style Routing (packages/app)

This routing table is scoped to outline-level folder matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"package root": {
		"path_scope": "packages/app",
		"sample_pool": ["packages/app/package.json", "packages/app/rsbuild.config.ts"]
	},
	"appdata": {
		"path_scope": "packages/app/appdata",
		"sample_pool": ["packages/app/appdata/app.tsx", "packages/app/appdata/panel.tsx"]
	},
	"components": {
		"path_scope": "packages/app/components",
		"sample_pool": ["packages/app/components/Session/index.tsx", "packages/app/components/Tooltip.tsx"]
	},
	"context": {
		"path_scope": "packages/app/context",
		"sample_pool": ["packages/app/context/global.ts", "packages/app/context/index.ts"]
	},
	"hooks": {
		"path_scope": "packages/app/hooks",
		"sample_pool": ["packages/app/hooks/useForm.ts", "packages/app/hooks/useTheme.ts"]
	},
	"layout": {
		"path_scope": "packages/app/layout",
		"sample_pool": ["packages/app/layout/index.tsx", "packages/app/layout/types.ts"]
	},
	"locales": {
		"path_scope": "packages/app/locales",
		"sample_pool": ["packages/app/locales/index.ts", "packages/app/locales/dayjs/en.ts"]
	},
	"models": {
		"path_scope": "packages/app/models",
		"sample_pool": ["packages/app/models/global.ts", "packages/app/models/theme.ts"]
	},
	"pages": {
		"path_scope": "packages/app/pages",
		"sample_pool": ["packages/app/pages/home/index.tsx", "packages/app/pages/session/index.tsx"]
	},
	"panel": {
		"path_scope": "packages/app/panel",
		"sample_pool": ["packages/app/panel/index.tsx", "packages/app/panel/model.ts"]
	},
	"runtime": {
		"path_scope": "packages/app/runtime",
		"sample_pool": ["packages/app/runtime/AppRoot.tsx", "packages/app/runtime/PageBridge.tsx"]
	},
	"setting": {
		"path_scope": "packages/app/setting",
		"sample_pool": ["packages/app/setting/index.tsx", "packages/app/setting/model_provider/index.tsx"]
	},
	"utils": {
		"path_scope": "packages/app/utils",
		"sample_pool": ["packages/app/utils/ipc.ts", "packages/app/utils/theme.ts"]
	}
}
```

## Notes

- Keep routes at package-domain granularity. Do not add nodes for routine component leaves or single page folders unless they become long-lived style islands.
- Add a deeper node only when a subdomain has a clearly distinct structure that is reused across multiple edits.
