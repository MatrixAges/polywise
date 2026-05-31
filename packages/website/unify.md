# Code Style Routing (packages/website)

This routing table is scoped to outline-level folder matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"package root": {
		"path_scope": "packages/website",
		"sample_pool": ["packages/website/package.json", "packages/website/styles/tailwind.global.css"]
	},
	"components": {
		"path_scope": "packages/website/components",
		"sample_pool": [
			"packages/website/components/MDXContent.tsx",
			"packages/website/components/DocContentPage/index.tsx"
		]
	},
	"mdx components": {
		"path_scope": "packages/website/components/Mdx",
		"sample_pool": [
			"packages/website/components/Mdx/Alert/index.tsx",
			"packages/website/components/Mdx/Tabs/index.tsx"
		]
	},
	"docs content": {
		"path_scope": "packages/website/public/content/docs",
		"sample_pool": [
			"packages/website/public/content/docs/intro/en.mdx",
			"packages/website/public/content/docs/usage/cli/en.mdx"
		]
	}
}
```

## Notes

- Keep routes at package-domain granularity.
- Add deeper nodes only when a folder becomes a stable style island with repeated edits.
