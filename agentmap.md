# Agent Map

This document is the outline-level map and code-style routing table for the workspace root. It covers repository-level automation and coordination files outside package-local agent maps.

## 1. Module Overview

- **Description**: Monorepo root for Polywise applications, packages, release automation, and Codex/plugin support files.
- **Architecture**: Workspace coordination layer with package directories, release/build scripts, shared config, and repository documentation/assets.

## 2. Outline Tree

```json
{
	"workspace_bootstrap": {
		"package_files": [
			"package.json",
			"pnpm-workspace.yaml",
			"pnpm-lock.yaml",
			"turbo.json",
			"README.md",
			"AGENTS.md"
		],
		"config": "Repository-level configuration and shared tooling inputs."
	},
	"product_packages": {
		"packages/app": "Frontend application package.",
		"packages/desktop": "Desktop shell and packaging flows.",
		"packages/polywise": "Backend and AI runtime package.",
		"packages/website": "Website and docs surface.",
		"packages/erpc": "Electron RPC support package.",
		"packages/stk": "Shared utility package."
	},
	"repository_automation": {
		"scripts": "Workspace-level automation for release, build, and artifact workflows.",
		"plugins": "Local Codex plugins and MCP bridge bundles."
	},
	"reference_assets": {
		"readme": "Supplemental product documentation.",
		"images": "Checked-in image assets.",
		"videos": "Checked-in video assets."
	}
}
```

## 3. Code Style Routing

This routing table is scoped to outline-level folder matching. Match by `path_scope` with longest-prefix wins.

```json
{
	"workspace root": {
		"path_scope": ".",
		"sample_pool": ["package.json", "turbo.json"]
	},
	"scripts": {
		"path_scope": "scripts",
		"sample_pool": ["scripts/collect_release_commits.mjs", "scripts/inspect_existing_draft_release.mjs"]
	}
}
```
