# Agent Map

This document is the outline-level map and code-style routing table for `packages/website`. It tracks stable website responsibilities and the sample routes used for coding alignment.

## 1. Module Overview

- **Description**: Marketing site and documentation package for Polywise.
- **Architecture**: Next.js App Router site with shared UI units, localized docs content, and worker-facing runtime helpers.

## 2. Outline Tree

```json
{
	"entry": [
		"package.json",
		"next.config.mjs",
		"vite.config.ts",
		"wrangler.jsonc",
		"tsconfig.json",
		"app.config.ts",
		"postcss.config.mjs",
		"i18n.ts"
	],
	"application_surfaces": {
		"app": "App Router pages, layouts, and route entries.",
		"appdata": "Route metadata and app-level content registries.",
		"appunits": "Reusable page composition units for landing, docs, and layout surfaces.",
		"components": "Shared website components, including docs, MDX, modal, loading, locale, and branding UI."
	},
	"runtime_and_shared_logic": {
		"hooks": "Reusable browser, viewport, theme, locale, and interaction hooks.",
		"models": "Client-side state helpers.",
		"services": "Theme and locale service layer.",
		"presets": "Runtime presets such as MobX wiring.",
		"utils": "Shared content, MDX, navigation, fetch, and DOM helper layer.",
		"worker": "Worker runtime entry.",
		"types": "Shared package types.",
		"typings": "Ambient declarations."
	},
	"content_and_assets": {
		"public": "Static assets, search snapshots, localized docs content, fonts, images, and theme files.",
		"locales": "Website locale dictionaries.",
		"styles": "Global stylesheet entry points and markdown styling.",
		"theme": "Theme tokens and custom component styling.",
		"build": "Build-time and indexing scripts.",
		"_tpl_": "Template-like starter surface for repeated page or component patterns."
	}
}
```

## 3. Code Style Routing

This routing table is scoped to outline-level folder matching. Match by `path_scope` with longest-prefix wins.

```json
{
	"package root": {
		"path_scope": "packages/website",
		"sample_pool": ["packages/website/package.json", "packages/website/next.config.mjs"]
	},
	"app": {
		"path_scope": "packages/website/app",
		"sample_pool": ["packages/website/app/layout.tsx", "packages/website/app/page.tsx"]
	},
	"appdata": {
		"path_scope": "packages/website/appdata",
		"sample_pool": ["packages/website/appdata/app.tsx", "packages/website/appdata/docs.tsx"]
	},
	"appunits": {
		"path_scope": "packages/website/appunits",
		"sample_pool": ["packages/website/appunits/index/index.ts", "packages/website/appunits/layout/index.ts"]
	},
	"components": {
		"path_scope": "packages/website/components",
		"sample_pool": [
			"packages/website/components/MDXContent.tsx",
			"packages/website/components/DocContentPage/index.tsx"
		]
	},
	"components/Mdx": {
		"path_scope": "packages/website/components/Mdx",
		"sample_pool": [
			"packages/website/components/Mdx/Alert/index.tsx",
			"packages/website/components/Mdx/Tabs/index.tsx"
		]
	},
	"hooks": {
		"path_scope": "packages/website/hooks",
		"sample_pool": ["packages/website/hooks/useTheme.ts", "packages/website/hooks/useLocale.ts"]
	},
	"services": {
		"path_scope": "packages/website/services",
		"sample_pool": ["packages/website/services/theme.ts", "packages/website/services/locale.ts"]
	},
	"styles": {
		"path_scope": "packages/website/styles",
		"sample_pool": ["packages/website/styles/tailwind.global.css", "packages/website/styles/vars.global.css"]
	},
	"utils": {
		"path_scope": "packages/website/utils",
		"sample_pool": ["packages/website/utils/content.ts", "packages/website/utils/getMDXContent.ts"]
	},
	"docs content": {
		"path_scope": "packages/website/public/content/docs",
		"sample_pool": [
			"packages/website/public/content/docs/intro/en.mdx",
			"packages/website/public/content/docs/config/en.mdx"
		]
	}
}
```

## 4. Notes

- Generated or transient directories such as `.next`, `.vinext`, `.wrangler`, `dist`, `node_modules`, and protected `__*` folders are intentionally omitted.
- Keep the map at package-domain granularity. Add deeper detail only when a stable website surface or runtime island emerges.
- Route nodes should prefer reusable surface boundaries such as `app`, `appunits`, `components`, `hooks`, `services`, and `utils` rather than one-off leaf folders.
