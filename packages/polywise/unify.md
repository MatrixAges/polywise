# Code Style Routing (packages/polywise)

This routing table is scoped to outline-level folder matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"package root": {
		"path_scope": "packages/polywise",
		"sample_pool": ["packages/polywise/package.json", "packages/polywise/rslib.config.ts"]
	},
	".test": {
		"path_scope": "packages/polywise/.test",
		"sample_pool": [
			"packages/polywise/.test/createRuntime.mjs",
			"packages/polywise/.test/functional-basic-search.mjs"
		]
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
	}
}
```

## Notes

- Keep routes at major package-domain granularity. Do not split further for one-off router folders, single agents, or isolated utility leaves.
- Third-level routes are reserved for very large, stable coordination roots such as `src/db/*` and `src/fst/*`.
