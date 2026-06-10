# Agent Map

This document is the outline-level map and code-style routing table for `packages/polywise`. It captures the package's long-lived runtime domains instead of enumerating every leaf file.

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
			"runtime_and_ops": "Routers for provider, OAuth provider, tool, version, upgrade, restart, stop, heartbeat, IM, and notification flows.",
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
			"services": "Database repositories, normalization helpers, and projection helpers.",
			"runtime": "DB init, migration, and prepared statement wiring."
		},
		"src/config": "Runtime config loading and watch lifecycle.",
		"src/consts": "App, provider, prompt, search, and pipeline constants.",
		"src/types": "Cross-module shared types.",
		"src/utils": "Shared runtime utilities, including command discovery and Codex OAuth bridge helpers."
	},
	"background_subsystems": {
		"src/cron": "Scheduled job runtime and lifecycle management.",
		"src/rewire": "Homeostasis and replay-based rewiring runtime.",
		"src/pthink": "Thinking and analytics runtime.",
		"src/report": "Report synthesis and scheduling runtime."
	},
	"package_support": {
		"datasets": "Fixtures for tests and retrieval experiments.",
		"scripts": "Package-local build and developer scripts.",
		"drizzle": "Checked-in migration snapshots.",
		"typings": "Ambient declarations."
	}
}
```

## 3. Code Style Routing

This routing table is scoped to outline-level folder matching. Match by `path_scope` with longest-prefix wins.

```json
{
	"package root": {
		"path_scope": "packages/polywise",
		"sample_pool": ["packages/polywise/package.json", "packages/polywise/rslib.config.ts"]
	},
	"scripts": {
		"path_scope": "packages/polywise/scripts",
		"sample_pool": ["packages/polywise/scripts/getChunks.ts", "packages/polywise/scripts/postBuild.ts"]
	},
	"src root": {
		"path_scope": "packages/polywise/src",
		"sample_pool": ["packages/polywise/src/index.ts", "packages/polywise/src/server.ts"]
	},
	"src/api": {
		"path_scope": "packages/polywise/src/api",
		"sample_pool": ["packages/polywise/src/api/index.ts", "packages/polywise/src/api/session.ts"]
	},
	"src/callback": {
		"path_scope": "packages/polywise/src/callback",
		"sample_pool": ["packages/polywise/src/callback/index.ts", "packages/polywise/src/callback/types.ts"]
	},
	"src/cli": {
		"path_scope": "packages/polywise/src/cli",
		"sample_pool": ["packages/polywise/src/cli/index.ts", "packages/polywise/src/cli/types.ts"]
	},
	"src/config": {
		"path_scope": "packages/polywise/src/config",
		"sample_pool": ["packages/polywise/src/config/index.ts", "packages/polywise/src/config/loadConfig.ts"]
	},
	"src/consts": {
		"path_scope": "packages/polywise/src/consts",
		"sample_pool": ["packages/polywise/src/consts/app.ts", "packages/polywise/src/consts/search.ts"]
	},
	"src/cron": {
		"path_scope": "packages/polywise/src/cron",
		"sample_pool": ["packages/polywise/src/cron/initCron.ts", "packages/polywise/src/cron/runJobSession.ts"]
	},
	"src/db": {
		"path_scope": "packages/polywise/src/db",
		"sample_pool": ["packages/polywise/src/db/index.ts", "packages/polywise/src/db/prepare.ts"]
	},
	"src/db/schema": {
		"path_scope": "packages/polywise/src/db/schema",
		"sample_pool": ["packages/polywise/src/db/schema/index.ts", "packages/polywise/src/db/schema/session.ts"]
	},
	"src/db/services": {
		"path_scope": "packages/polywise/src/db/services",
		"sample_pool": [
			"packages/polywise/src/db/services/index.ts",
			"packages/polywise/src/db/services/session.ts"
		]
	},
	"src/fetch": {
		"path_scope": "packages/polywise/src/fetch",
		"sample_pool": ["packages/polywise/src/fetch/index.ts", "packages/polywise/src/fetch/runtime.ts"]
	},
	"src/fst": {
		"path_scope": "packages/polywise/src/fst",
		"sample_pool": ["packages/polywise/src/fst/index.ts", "packages/polywise/src/fst/provider.ts"]
	},
	"src/fst/agents": {
		"path_scope": "packages/polywise/src/fst/agents",
		"sample_pool": [
			"packages/polywise/src/fst/agents/index.ts",
			"packages/polywise/src/fst/agents/superego/index.ts"
		]
	},
	"src/fst/domains": {
		"path_scope": "packages/polywise/src/fst/domains",
		"sample_pool": [
			"packages/polywise/src/fst/domains/index.ts",
			"packages/polywise/src/fst/domains/group/index.ts"
		]
	},
	"src/fst/mcp": {
		"path_scope": "packages/polywise/src/fst/mcp",
		"sample_pool": ["packages/polywise/src/fst/mcp/index.ts", "packages/polywise/src/fst/mcp/loadMcpTools.ts"]
	},
	"src/fst/session": {
		"path_scope": "packages/polywise/src/fst/session",
		"sample_pool": [
			"packages/polywise/src/fst/session/index.ts",
			"packages/polywise/src/fst/session/kernel/send.ts"
		]
	},
	"src/fst/telemetry": {
		"path_scope": "packages/polywise/src/fst/telemetry",
		"sample_pool": [
			"packages/polywise/src/fst/telemetry/index.ts",
			"packages/polywise/src/fst/telemetry/searchFailureCases.ts"
		]
	},
	"src/fst/tools": {
		"path_scope": "packages/polywise/src/fst/tools",
		"sample_pool": ["packages/polywise/src/fst/tools/index.ts", "packages/polywise/src/fst/tools/search.ts"]
	},
	"src/fst/utils": {
		"path_scope": "packages/polywise/src/fst/utils",
		"sample_pool": ["packages/polywise/src/fst/utils/index.ts", "packages/polywise/src/fst/utils/submit.ts"]
	},
	"src/im": {
		"path_scope": "packages/polywise/src/im",
		"sample_pool": ["packages/polywise/src/im/index.ts", "packages/polywise/src/im/runtime.ts"]
	},
	"src/io": {
		"path_scope": "packages/polywise/src/io",
		"sample_pool": ["packages/polywise/src/io/index.ts", "packages/polywise/src/io/search/index.ts"]
	},
	"src/llama": {
		"path_scope": "packages/polywise/src/llama",
		"sample_pool": ["packages/polywise/src/llama/index.ts", "packages/polywise/src/llama/getModelContext.ts"]
	},
	"src/pipeline": {
		"path_scope": "packages/polywise/src/pipeline",
		"sample_pool": [
			"packages/polywise/src/pipeline/index.ts",
			"packages/polywise/src/pipeline/getRewriteQuery.ts"
		]
	},
	"src/pthink": {
		"path_scope": "packages/polywise/src/pthink",
		"sample_pool": ["packages/polywise/src/pthink/index.ts", "packages/polywise/src/pthink/runtime.ts"]
	},
	"src/report": {
		"path_scope": "packages/polywise/src/report",
		"sample_pool": ["packages/polywise/src/report/index.ts", "packages/polywise/src/report/runtime.ts"]
	},
	"src/rewire": {
		"path_scope": "packages/polywise/src/rewire",
		"sample_pool": ["packages/polywise/src/rewire/index.ts", "packages/polywise/src/rewire/runtime.ts"]
	},
	"src/rpc": {
		"path_scope": "packages/polywise/src/rpc",
		"sample_pool": ["packages/polywise/src/rpc/index.ts", "packages/polywise/src/rpc/session/index.ts"]
	},
	"src/sniffer": {
		"path_scope": "packages/polywise/src/sniffer",
		"sample_pool": ["packages/polywise/src/sniffer/index.ts", "packages/polywise/src/sniffer/chromium.ts"]
	},
	"src/types": {
		"path_scope": "packages/polywise/src/types",
		"sample_pool": ["packages/polywise/src/types/index.ts", "packages/polywise/src/types/config.ts"]
	},
	"src/utils": {
		"path_scope": "packages/polywise/src/utils",
		"sample_pool": ["packages/polywise/src/utils/index.ts", "packages/polywise/src/utils/trpc.ts"]
	},
	"src/utils/codexOauth": {
		"path_scope": "packages/polywise/src/utils/codexOauth",
		"sample_pool": [
			"packages/polywise/src/utils/codexOauth/index.ts",
			"packages/polywise/src/utils/codexOauth/readCodexAuthState.ts"
		]
	}
}
```

## 4. Notes

- Generated output such as `dist` and dependency directories such as `node_modules` are intentionally omitted.
- Only add third-level detail when a subdomain is large enough to be a stable coordination boundary, such as `src/fst` or `src/db`.
- Keep routes at major package-domain granularity. Do not split further for one-off router folders, single agents, or isolated utility leaves.
- Third-level routes are reserved for very large, stable coordination roots such as `src/db/*` and `src/fst/*`.
