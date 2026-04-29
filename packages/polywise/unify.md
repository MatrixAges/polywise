# Code Style Routing (packages/polywise)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"src/api": {
		"path_scope": "packages/polywise/src/api",
		"sample_pool": ["packages/polywise/src/api/test.ts", "packages/polywise/src/utils/connectSession.ts"]
	},
	"src/config": {
		"path_scope": "packages/polywise/src/config",
		"sample_pool": ["packages/polywise/src/config/loadConfig.ts", "packages/polywise/src/types/config.ts"]
	},
	"src/consts/prompts": {
		"path_scope": "packages/polywise/src/consts/prompts",
		"sample_pool": [
			"packages/polywise/src/consts/prompts/getContextPrompt.ts",
			"packages/polywise/src/consts/prompts/getTrimPrompt.ts"
		]
	},
	"src/consts/providers": {
		"path_scope": "packages/polywise/src/consts/providers",
		"sample_pool": [
			"packages/polywise/src/consts/providers/google_gemini.ts",
			"packages/polywise/src/consts/providers/openai_compatible.ts"
		]
	},
	"src/consts root": {
		"path_scope": "packages/polywise/src/consts",
		"sample_pool": [
			"packages/polywise/src/consts/pipeline.ts",
			"packages/polywise/src/consts/providers/index.ts"
		]
	},
	"src/cron": {
		"path_scope": "packages/polywise/src/cron",
		"sample_pool": ["packages/polywise/src/cron/reloadJob.ts", "packages/polywise/src/cron/runJobSession.ts"]
	},
	"src/db/schema/externals": {
		"path_scope": "packages/polywise/src/db/schema/externals",
		"sample_pool": [
			"packages/polywise/src/db/schema/externals/node_chunk.ts",
			"packages/polywise/src/db/schema/externals/index.ts"
		]
	},
	"src/db/schema/externals/project_todo": {
		"path_scope": "packages/polywise/src/db/schema/externals/project_todo",
		"sample_pool": [
			"packages/polywise/src/db/schema/externals/agent_todo.ts",
			"packages/polywise/src/db/schema/externals/todo_tag.ts"
		]
	},
	"src/db/schema": {
		"path_scope": "packages/polywise/src/db/schema",
		"sample_pool": ["packages/polywise/src/db/schema/session.ts", "packages/polywise/src/db/schema/index.ts"]
	},
	"src/db/schema/project": {
		"path_scope": "packages/polywise/src/db/schema/project",
		"sample_pool": [
			"packages/polywise/src/db/schema/externals/project_session.ts",
			"packages/polywise/src/db/schema/externals/project_todo.ts"
		]
	},
	"src/db/services/externals": {
		"path_scope": "packages/polywise/src/db/services/externals",
		"sample_pool": [
			"packages/polywise/src/db/services/externals/notification_session.ts",
			"packages/polywise/src/db/services/externals/index.ts"
		]
	},
	"src/db/services/project": {
		"path_scope": "packages/polywise/src/db/services/project",
		"sample_pool": [
			"packages/polywise/src/db/services/externals/project_session.ts",
			"packages/polywise/src/db/services/externals/index.ts"
		]
	},
	"src/db/services": {
		"path_scope": "packages/polywise/src/db/services",
		"sample_pool": [
			"packages/polywise/src/db/services/message.ts",
			"packages/polywise/src/db/services/index.ts"
		]
	},
	"src/rpc/project": {
		"path_scope": "packages/polywise/src/rpc/project",
		"sample_pool": ["packages/polywise/src/rpc/session/index.ts", "packages/polywise/src/rpc/file/index.ts"]
	},
	"src/db root": {
		"path_scope": "packages/polywise/src/db",
		"sample_pool": ["packages/polywise/src/db/migrate.ts", "packages/polywise/src/db/prepare.ts"]
	},
	"src/io/search": {
		"path_scope": "packages/polywise/src/io/search",
		"sample_pool": [
			"packages/polywise/src/io/search/lookup.ts",
			"packages/polywise/src/io/search/rankByTime.ts"
		]
	},
	"src/io/save": {
		"path_scope": "packages/polywise/src/io/save",
		"sample_pool": ["packages/polywise/src/io/save/saveDocument.ts", "packages/polywise/src/io/index.ts"]
	},
	"src/io/common": {
		"path_scope": "packages/polywise/src/io/common",
		"sample_pool": ["packages/polywise/src/io/remove.ts", "packages/polywise/src/io/save/index.ts"]
	},
	"src/io root": {
		"path_scope": "packages/polywise/src/io",
		"sample_pool": ["packages/polywise/src/io/search/index.ts", "packages/polywise/src/io/save/index.ts"]
	},
	"src/llama": {
		"path_scope": "packages/polywise/src/llama",
		"sample_pool": ["packages/polywise/src/llama/getModelContext.ts", "packages/polywise/src/llama/index.ts"]
	},
	"src/pipeline/getChunks": {
		"path_scope": "packages/polywise/src/pipeline/getChunks",
		"sample_pool": [
			"packages/polywise/src/pipeline/getChunks/getSemanticChunks/index.ts",
			"packages/polywise/src/pipeline/getChunks/getSemanticChunks/getRawText.ts"
		]
	},
	"src/pipeline/getChunkWords": {
		"path_scope": "packages/polywise/src/pipeline/getChunkWords",
		"sample_pool": [
			"packages/polywise/src/pipeline/getChunkWords/isValidBigram.ts",
			"packages/polywise/src/pipeline/getChunkWords/jieba.ts"
		]
	},
	"src/pipeline root": {
		"path_scope": "packages/polywise/src/pipeline",
		"sample_pool": [
			"packages/polywise/src/pipeline/getRewriteQuery.ts",
			"packages/polywise/src/pipeline/index.ts"
		]
	},
	"src/rpc/session": {
		"path_scope": "packages/polywise/src/rpc/session",
		"sample_pool": [
			"packages/polywise/src/rpc/session/index.ts",
			"packages/polywise/src/rpc/session/utils/index.ts"
		]
	},
	"src/rpc/file": {
		"path_scope": "packages/polywise/src/rpc/file",
		"sample_pool": ["packages/polywise/src/rpc/file/index.ts", "packages/polywise/src/rpc/search.ts"]
	},
	"src/rpc/provider": {
		"path_scope": "packages/polywise/src/rpc/provider",
		"sample_pool": ["packages/polywise/src/consts/providers/index.ts", "packages/polywise/src/rpc/index.ts"]
	},
	"src/rpc/llama": {
		"path_scope": "packages/polywise/src/rpc/llama",
		"sample_pool": [
			"packages/polywise/src/rpc/llama/getStatus.ts",
			"packages/polywise/src/rpc/llama/progress.ts"
		]
	},
	"src/rpc root": {
		"path_scope": "packages/polywise/src/rpc",
		"sample_pool": ["packages/polywise/src/rpc/save.ts", "packages/polywise/src/rpc/setActive.ts"]
	},
	"package root config": {
		"path_scope": "packages/polywise",
		"sample_pool": ["packages/polywise/package.json", "packages/polywise/rslib.config.ts"]
	},
	".test": {
		"path_scope": "packages/polywise/.test",
		"sample_pool": ["packages/polywise/scripts/getChunks.ts", "packages/polywise/scripts/getTriple.ts"]
	},
	"src/fst/agents/title": {
		"path_scope": "packages/polywise/src/fst/agents/title",
		"sample_pool": [
			"packages/polywise/src/fst/agents/title/index.ts",
			"packages/polywise/src/fst/tools/title.ts"
		]
	},
	"src/fst/agents/superego": {
		"path_scope": "packages/polywise/src/fst/agents/superego",
		"sample_pool": [
			"packages/polywise/src/fst/agents/superego/memory_tool.ts",
			"packages/polywise/src/fst/agents/superego/wiki_tool.ts"
		]
	},
	"src/fst/agents/skill_creator": {
		"path_scope": "packages/polywise/src/fst/agents/skill_creator",
		"sample_pool": [
			"packages/polywise/src/fst/agents/skill_creator/defaultSkill.ts",
			"packages/polywise/src/fst/agents/skill_creator/index.ts"
		]
	},
	"src/fst/agents/trim": {
		"path_scope": "packages/polywise/src/fst/agents/trim",
		"sample_pool": [
			"packages/polywise/src/fst/agents/trim/index.ts",
			"packages/polywise/src/consts/prompts/getTrimPrompt.ts"
		]
	},
	"src/fst/agents/permission": {
		"path_scope": "packages/polywise/src/fst/agents/permission",
		"sample_pool": [
			"packages/polywise/src/fst/agents/permission/extract.ts",
			"packages/polywise/src/fst/agents/permission/format.ts"
		]
	},
	"src/fst/agents/audit": {
		"path_scope": "packages/polywise/src/fst/agents/audit",
		"sample_pool": [
			"packages/polywise/src/fst/agents/audit/index.ts",
			"packages/polywise/src/consts/prompts/getAuditPrompt.ts"
		]
	},
	"src/fst/agents/supervisor": {
		"path_scope": "packages/polywise/src/fst/agents/supervisor",
		"sample_pool": [
			"packages/polywise/src/fst/agents/supervisor/startStream.ts",
			"packages/polywise/src/fst/agents/supervisor/stopStream.ts"
		]
	},
	"src/fst/agents/system": {
		"path_scope": "packages/polywise/src/fst/agents/system",
		"sample_pool": [
			"packages/polywise/src/fst/agents/system/bash.ts",
			"packages/polywise/src/fst/agents/system/fs.ts"
		]
	},
	"src/fst/agents root": {
		"path_scope": "packages/polywise/src/fst/agents",
		"sample_pool": [
			"packages/polywise/src/fst/agents/superego/index.ts",
			"packages/polywise/src/fst/agents/permission/index.ts"
		]
	},
	"src/fst/tools/edit": {
		"path_scope": "packages/polywise/src/fst/tools/edit",
		"sample_pool": [
			"packages/polywise/src/fst/tools/edit/count.ts",
			"packages/polywise/src/fst/tools/edit/error.ts"
		]
	},
	"src/fst/tools/skill": {
		"path_scope": "packages/polywise/src/fst/tools/skill",
		"sample_pool": [
			"packages/polywise/src/fst/tools/skill/rebuild.ts",
			"packages/polywise/src/fst/tools/skill/search.ts"
		]
	},
	"src/fst/tools/meta": {
		"path_scope": "packages/polywise/src/fst/tools/meta",
		"sample_pool": [
			"packages/polywise/src/fst/tools/meta/rebuild.ts",
			"packages/polywise/src/fst/tools/meta/read.ts"
		]
	},
	"src/fst/tools root": {
		"path_scope": "packages/polywise/src/fst/tools",
		"sample_pool": ["packages/polywise/src/fst/tools/message.ts", "packages/polywise/src/fst/tools/index.ts"]
	},
	"src/fst/mcp": {
		"path_scope": "packages/polywise/src/fst/mcp",
		"sample_pool": [
			"packages/polywise/src/fst/mcp/loadConfig.ts",
			"packages/polywise/src/fst/mcp/getEnabledMcps.ts"
		]
	},
	"src/fst/session/context": {
		"path_scope": "packages/polywise/src/fst/session/context",
		"sample_pool": [
			"packages/polywise/src/fst/session/context/index.ts",
			"packages/polywise/src/fst/session/state/index.ts"
		]
	},
	"src/fst/session/message": {
		"path_scope": "packages/polywise/src/fst/session/message",
		"sample_pool": [
			"packages/polywise/src/fst/session/message/index.ts",
			"packages/polywise/src/fst/session/messages/index.ts"
		]
	},
	"src/fst/session/messages": {
		"path_scope": "packages/polywise/src/fst/session/messages",
		"sample_pool": [
			"packages/polywise/src/fst/session/messages/getMessages.ts",
			"packages/polywise/src/fst/session/messages/index.ts"
		]
	},
	"src/fst/session/related": {
		"path_scope": "packages/polywise/src/fst/session/related",
		"sample_pool": [
			"packages/polywise/src/fst/session/related/getAgents.ts",
			"packages/polywise/src/fst/session/related/index.ts"
		]
	},
	"src/fst/session/session": {
		"path_scope": "packages/polywise/src/fst/session/session",
		"sample_pool": [
			"packages/polywise/src/fst/session/session/getSession.ts",
			"packages/polywise/src/fst/session/session/index.ts"
		]
	},
	"src/fst/session/state": {
		"path_scope": "packages/polywise/src/fst/session/state",
		"sample_pool": [
			"packages/polywise/src/fst/session/state/index.ts",
			"packages/polywise/src/fst/session/context/index.ts"
		]
	},
	"src/fst/session/stream": {
		"path_scope": "packages/polywise/src/fst/session/stream",
		"sample_pool": [
			"packages/polywise/src/fst/session/stream/index.ts",
			"packages/polywise/src/fst/agents/supervisor/startStream.ts"
		]
	},
	"src/fst/session/task": {
		"path_scope": "packages/polywise/src/fst/session/task",
		"sample_pool": [
			"packages/polywise/src/fst/session/task/clearTasks.ts",
			"packages/polywise/src/fst/session/task/index.ts"
		]
	},
	"src/fst/session/utils": {
		"path_scope": "packages/polywise/src/fst/session/utils",
		"sample_pool": [
			"packages/polywise/src/fst/session/utils/active.ts",
			"packages/polywise/src/fst/session/utils/index.ts"
		]
	},
	"src/fst/session root": {
		"path_scope": "packages/polywise/src/fst/session",
		"sample_pool": [
			"packages/polywise/src/fst/session/messages/index.ts",
			"packages/polywise/src/fst/session/stream/index.ts"
		]
	},
	"src/fst/telemetry": {
		"path_scope": "packages/polywise/src/fst/telemetry",
		"sample_pool": [
			"packages/polywise/src/fst/telemetry/searchFailureCases.ts",
			"packages/polywise/src/fst/telemetry/index.ts"
		]
	},
	"src/fst/utils/getBashTools": {
		"path_scope": "packages/polywise/src/fst/utils/getBashTools",
		"sample_pool": [
			"packages/polywise/src/fst/utils/getBashTools/getMatchedRules.ts",
			"packages/polywise/src/fst/utils/getBashTools/getCleanCommand.ts"
		]
	},
	"src/fst/utils/system": {
		"path_scope": "packages/polywise/src/fst/utils/system",
		"sample_pool": [
			"packages/polywise/src/fst/utils/system/getPresetCommands.ts",
			"packages/polywise/src/fst/utils/system/index.ts"
		]
	},
	"src/fst/utils root": {
		"path_scope": "packages/polywise/src/fst/utils",
		"sample_pool": ["packages/polywise/src/fst/utils/index.ts", "packages/polywise/src/fst/utils/safeshell.ts"]
	},
	"src/fst root": {
		"path_scope": "packages/polywise/src/fst",
		"sample_pool": ["packages/polywise/src/fst/clean.ts", "packages/polywise/src/fst/types.ts"]
	},
	"src/utils/rstream": {
		"path_scope": "packages/polywise/src/utils/rstream",
		"sample_pool": ["packages/polywise/src/utils/session.ts", "packages/polywise/src/utils/log.ts"]
	},
	"src/utils root": {
		"path_scope": "packages/polywise/src/utils",
		"sample_pool": ["packages/polywise/src/utils/initServer.ts", "packages/polywise/src/utils/index.ts"]
	},
	"src/types": {
		"path_scope": "packages/polywise/src/types",
		"sample_pool": ["packages/polywise/src/types/pipeline.ts", "packages/polywise/src/types/llm.ts"]
	}
}
```
