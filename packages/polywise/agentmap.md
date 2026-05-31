# Agent Map

This document is an outline-level map of `packages/polywise`. It captures the package's long-lived runtime domains instead of enumerating every leaf file.

## 1. Module Overview

- **Description**: Polywise backend and AI runtime package.
- **Architecture**: TypeScript service runtime around search/memory pipelines, session orchestration, and SQLite-backed state.

## 2. Outline Tree

```json
{
	"entry_and_bootstrap": {
		"package_files": [
			"package.json",
			"rslib.config.ts",
			"drizzle.config.ts",
			"rstest.config.ts",
			"tsconfig.json",
			"tsconfig.build.json",
			"inspect.sh"
		],
		"src/index.ts": "Primary package runtime entry.",
		"src/server.ts": "Standalone server entry.",
		"src/cli": "CLI surface for local runtime and tooling flows.",
		"src/env.ts": "Environment normalization.",
		"src/auth.ts": "Authentication bootstrap."
	},
	"service_interfaces": {
		"src/api": "HTTP-facing endpoints and session/page access surface.",
		"src/rpc": {
			"workspace_domains": "Routers for agent, article, project, session, todo, skill, group, post, and home workflows.",
			"runtime_and_ops": "Routers for provider, tool, version, upgrade, restart, stop, heartbeat, IM, and notification flows.",
			"knowledge_domains": "Routers for search, save, update, linkcase, pipeline, report, and related knowledge operations."
		},
		"src/im": "IM runtime, routes, stream bridge, and session integration."
	},
	"session_and_agent_runtime": {
		"src/fst": {
			"session": "Session kernel, caps, config/context/state, message persistence, tasks, and stream lifecycle.",
			"tools": "Tool registry plus edit, meta, prompt, skill, search, web, and runtime helpers.",
			"agents": "Control agents such as permission, audit, title, trim, supervisor, superego, system, and skill_creator.",
			"domains": "Behavior plugins for normal, blocked, agent, group, linkcase, and post session modes.",
			"mcp": "MCP client bootstrap and tool loading.",
			"telemetry": "Patch suggestion and failure telemetry."
		},
		"src/callback": "Content callback persistence and trace reconstruction helpers."
	},
	"knowledge_pipeline": {
		"src/pipeline": "Embedding, chunking, triples, rewrite, rerank, and vector preparation pipeline.",
		"src/io": "Save, search, relation, semantic, and removal orchestration.",
		"src/fetch": "Remote content acquisition adapters.",
		"src/llama": "Model loading and context helpers.",
		"src/sniffer": "Browser sniffing adapters."
	},
	"data_and_shared_foundations": {
		"src/db": {
			"schema": "Drizzle tables and relation declarations.",
			"services": "Database repositories and projection helpers.",
			"runtime": "DB init, migration, and prepared statement wiring."
		},
		"src/config": "Runtime config loading and watch lifecycle.",
		"src/consts": "App, provider, prompt, search, and pipeline constants.",
		"src/types": "Cross-module shared types.",
		"src/utils": "Shared runtime utilities."
	},
	"background_subsystems": {
		"src/cron": "Scheduled job runtime and lifecycle management.",
		"src/rewire": "Homeostasis and replay-based rewiring runtime.",
		"src/pthink": "Thinking and analytics runtime.",
		"src/report": "Report synthesis and scheduling runtime."
	},
	"package_support": {
		".test": "Node-based functional and regression harness.",
		"datasets": "Fixtures for tests and retrieval experiments.",
		"scripts": "Package-local build and developer scripts.",
		"drizzle": "Checked-in migration snapshots.",
		"typings": "Ambient declarations."
	}
}
```

## 3. Notes

- Generated output such as `dist` and dependency directories such as `node_modules` are intentionally omitted.
- Only add third-level detail when a subdomain is large enough to be a stable coordination boundary, such as `src/fst` or `src/db`.
