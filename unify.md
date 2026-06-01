# Code Style Routing (workspace root)

This routing table is scoped to outline-level folder matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"workspace root": {
		"path_scope": ".",
		"sample_pool": ["package.json", "scripts/release.ts"]
	},
	"scripts": {
		"path_scope": "scripts",
		"sample_pool": ["scripts/release.ts", "package.json"]
	}
}
```

## Notes

- Keep root-level routes minimal and reserve them for workspace configuration or shared automation scripts.
- Release preparation scripts should stay in `scripts/` and be invoked from workflow source files rather than embedded as long shell snippets.
