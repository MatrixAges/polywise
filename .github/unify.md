# Code Style Routing (.github)

This routing table is scoped to outline-level folder matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"github root": {
		"path_scope": ".github",
		"sample_pool": [".github/tsflows/release.ts", ".github/workflows/release.generated.yml"]
	},
	"tsflows": {
		"path_scope": ".github/tsflows",
		"sample_pool": [".github/tsflows/release.ts", ".github/tsflows/prepare.ts"]
	},
	"workflows": {
		"path_scope": ".github/workflows",
		"sample_pool": [".github/workflows/release.generated.yml", ".github/workflows/prepare.generated.yml"]
	}
}
```

## Notes

- Keep routes at folder granularity. Do not add one-off nodes for individual workflow files unless the directory grows into distinct workflow domains.
- Workflow source files should live under `.github/tsflows`.
- Generated workflow YAML files should continue to live under `.github/workflows`.
