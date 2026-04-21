# Code Style Routing (packages/polywise)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"src/api": {
		"path_scope": "packages/polywise/src/api",
		"description": "HTTP API layer and session streaming endpoints.",
		"fractal_rule": "Keep endpoint handlers atomic by route intent and aggregate with `api/index.ts`.",
		"import_order": "1) third-party server libs; 2) @core aliases; 3) relative helpers; 4) type-only imports.",
		"naming_rules": "Route handler exports use concise verbs (`get`, `post`) and helper names use camelCase.",
		"Same Code 1": "packages/polywise/src/api/index.ts",
		"Same Code 2": "packages/polywise/src/api/session.ts",
		"sample_pool": ["packages/polywise/src/api/test.ts", "packages/polywise/src/utils/connectSession.ts"]
	},
	"src/config": {
		"path_scope": "packages/polywise/src/config",
		"description": "Runtime config loading, initialization, and watchers.",
		"fractal_rule": "Keep config lifecycle split by init/load/index responsibilities.",
		"import_order": "1) third-party libs; 2) @core aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Config helpers use camelCase and explicit init/load prefixes.",
		"Same Code 1": "packages/polywise/src/config/index.ts",
		"Same Code 2": "packages/polywise/src/config/initConfig.ts",
		"sample_pool": ["packages/polywise/src/config/loadConfig.ts", "packages/polywise/src/types/config.ts"]
	},
	"src/consts/prompts": {
		"path_scope": "packages/polywise/src/consts/prompts",
		"description": "Pure prompt builders and prompt markdown resources.",
		"fractal_rule": "One prompt builder per `getXxxPrompt.ts`; markdown prompt assets stay colocated.",
		"import_order": "1) type-only imports; 2) local constants/helpers.",
		"naming_rules": "Builder files use `getXxxPrompt.ts` and default export a single pure function.",
		"Same Code 1": "packages/polywise/src/consts/prompts/getSkillPrompt.ts",
		"Same Code 2": "packages/polywise/src/consts/prompts/getTitlePrompt.ts",
		"sample_pool": [
			"packages/polywise/src/consts/prompts/getContextPrompt.ts",
			"packages/polywise/src/consts/prompts/getTrimPrompt.ts"
		]
	},
	"src/consts/providers": {
		"path_scope": "packages/polywise/src/consts/providers",
		"description": "Provider presets and provider registry aggregation.",
		"fractal_rule": "One provider descriptor per file and root `index.ts` for aggregation/export.",
		"import_order": "1) local provider files; 2) third-party/provider-specific imports if needed; 3) type-only imports.",
		"naming_rules": "Provider file names stay snake_case/lowercase as currently established.",
		"Same Code 1": "packages/polywise/src/consts/providers/index.ts",
		"Same Code 2": "packages/polywise/src/consts/providers/openai.ts",
		"sample_pool": [
			"packages/polywise/src/consts/providers/google_gemini.ts",
			"packages/polywise/src/consts/providers/openai_compatible.ts"
		]
	},
	"src/consts root": {
		"path_scope": "packages/polywise/src/consts",
		"description": "Root constants exports and non-folder constant modules.",
		"fractal_rule": "Keep root constants simple and delegate dense domains into subfolders.",
		"import_order": "1) local const modules; 2) type-only imports.",
		"naming_rules": "Root exports remain minimal and explicit.",
		"Same Code 1": "packages/polywise/src/consts/index.ts",
		"Same Code 2": "packages/polywise/src/consts/app.ts",
		"sample_pool": [
			"packages/polywise/src/consts/pipeline.ts",
			"packages/polywise/src/consts/providers/index.ts"
		]
	},
	"src/cron": {
		"path_scope": "packages/polywise/src/cron",
		"description": "Cron store/runtime/job lifecycle orchestration.",
		"fractal_rule": "Keep cron operations atomic by action (create/reload/stop/read/write) with root index aggregation.",
		"import_order": "1) third-party libs; 2) @core aliases; 3) local cron modules; 4) type-only imports.",
		"naming_rules": "Function files use action-first camelCase names.",
		"Same Code 1": "packages/polywise/src/cron/index.ts",
		"Same Code 2": "packages/polywise/src/cron/createRuntime.ts",
		"sample_pool": ["packages/polywise/src/cron/reloadJob.ts", "packages/polywise/src/cron/runJobSession.ts"]
	},
	"src/db/schema/externals": {
		"path_scope": "packages/polywise/src/db/schema/externals",
		"description": "Cross-table relation schema definitions.",
		"fractal_rule": "Keep one relation table schema per file and aggregate from folder `index.ts`.",
		"import_order": "1) drizzle libs; 2) local schema references; 3) type-only imports.",
		"naming_rules": "File and schema names follow snake_case relation semantics.",
		"Same Code 1": "packages/polywise/src/db/schema/externals/session_agent.ts",
		"Same Code 2": "packages/polywise/src/db/schema/externals/project_session.ts",
		"sample_pool": [
			"packages/polywise/src/db/schema/externals/node_chunk.ts",
			"packages/polywise/src/db/schema/externals/index.ts"
		]
	},
	"src/db/schema": {
		"path_scope": "packages/polywise/src/db/schema",
		"description": "Primary drizzle table schemas.",
		"fractal_rule": "One table schema per file with root `index.ts` schema aggregation.",
		"import_order": "1) drizzle imports; 2) utility/schema refs; 3) type-only imports.",
		"naming_rules": "Schema variables use camelCase; DB columns use snake_case.",
		"Same Code 1": "packages/polywise/src/db/schema/article.ts",
		"Same Code 2": "packages/polywise/src/db/schema/node.ts",
		"sample_pool": ["packages/polywise/src/db/schema/session.ts", "packages/polywise/src/db/schema/index.ts"]
	},
	"src/db/services/externals": {
		"path_scope": "packages/polywise/src/db/services/externals",
		"description": "Service-layer helpers for external relation tables.",
		"fractal_rule": "One relation service group per file; aggregate via folder `index.ts`.",
		"import_order": "1) @core/db schema/env; 2) drizzle helpers; 3) local helpers; 4) type-only imports.",
		"naming_rules": "Service functions use verb-based camelCase names.",
		"Same Code 1": "packages/polywise/src/db/services/externals/session_agent.ts",
		"Same Code 2": "packages/polywise/src/db/services/externals/project_session.ts",
		"sample_pool": [
			"packages/polywise/src/db/services/externals/notification_session.ts",
			"packages/polywise/src/db/services/externals/index.ts"
		]
	},
	"src/db/services": {
		"path_scope": "packages/polywise/src/db/services",
		"description": "Service-layer wrappers around db schema operations.",
		"fractal_rule": "Keep one domain service per file and expose via `services/index.ts`.",
		"import_order": "1) @core/db schema/env; 2) drizzle libs; 3) local service helpers; 4) type-only imports.",
		"naming_rules": "Use action-first camelCase functions (`get*`, `add*`, `update*`, `remove*`).",
		"Same Code 1": "packages/polywise/src/db/services/node.ts",
		"Same Code 2": "packages/polywise/src/db/services/article.ts",
		"sample_pool": [
			"packages/polywise/src/db/services/message.ts",
			"packages/polywise/src/db/services/index.ts"
		]
	},
	"src/db root": {
		"path_scope": "packages/polywise/src/db",
		"description": "Database bootstrap, initialization, migration, and exported db types.",
		"fractal_rule": "Keep initialization flow split into small files and wire through `db/index.ts`.",
		"import_order": "1) third-party db libs; 2) @core aliases; 3) local db modules; 4) type-only imports.",
		"naming_rules": "DB init helpers use init/prepare/migrate prefixes.",
		"Same Code 1": "packages/polywise/src/db/index.ts",
		"Same Code 2": "packages/polywise/src/db/initDB.ts",
		"sample_pool": ["packages/polywise/src/db/migrate.ts", "packages/polywise/src/db/prepare.ts"]
	},
	"src/io/search": {
		"path_scope": "packages/polywise/src/io/search",
		"description": "Search workflow orchestration and ranking pipeline internals.",
		"fractal_rule": "Keep orchestration in `search/index.ts`; split each ranking/filtering step into dedicated files.",
		"import_order": "1) @core aliases; 2) third-party libs; 3) local search modules; 4) type-only imports.",
		"naming_rules": "Search pipeline functions use camelCase with explicit stage names.",
		"Same Code 1": "packages/polywise/src/io/search/index.ts",
		"Same Code 2": "packages/polywise/src/io/search/rerank.ts",
		"sample_pool": [
			"packages/polywise/src/io/search/lookup.ts",
			"packages/polywise/src/io/search/rankByTime.ts"
		]
	},
	"src/io/save": {
		"path_scope": "packages/polywise/src/io/save",
		"description": "Save workflow for articles/documents.",
		"fractal_rule": "Use `save/index.ts` as flow entry and keep each save target in dedicated file.",
		"import_order": "1) @core aliases; 2) local save modules; 3) type-only imports.",
		"naming_rules": "Save helpers use verb-first camelCase names.",
		"Same Code 1": "packages/polywise/src/io/save/index.ts",
		"Same Code 2": "packages/polywise/src/io/save/saveArticle.ts",
		"sample_pool": ["packages/polywise/src/io/save/saveDocument.ts", "packages/polywise/src/io/index.ts"]
	},
	"src/io/common": {
		"path_scope": "packages/polywise/src/io/common",
		"description": "IO-shared helper namespace.",
		"fractal_rule": "Keep shared IO helper exports centralized and minimal.",
		"import_order": "1) local helpers; 2) type-only imports.",
		"naming_rules": "Common helpers use concise camelCase names.",
		"Same Code 1": "packages/polywise/src/io/common/index.ts",
		"Same Code 2": "packages/polywise/src/io/index.ts",
		"sample_pool": ["packages/polywise/src/io/remove.ts", "packages/polywise/src/io/save/index.ts"]
	},
	"src/io root": {
		"path_scope": "packages/polywise/src/io",
		"description": "Top-level IO exports and thin wrappers.",
		"fractal_rule": "Root entry aggregates domain folders without embedding deep business logic.",
		"import_order": "1) @core aliases; 2) local io domains; 3) type-only imports.",
		"naming_rules": "Root files stay concise and explicit.",
		"Same Code 1": "packages/polywise/src/io/index.ts",
		"Same Code 2": "packages/polywise/src/io/remove.ts",
		"sample_pool": ["packages/polywise/src/io/search/index.ts", "packages/polywise/src/io/save/index.ts"]
	},
	"src/llama": {
		"path_scope": "packages/polywise/src/llama",
		"description": "Llama model loading and context helpers.",
		"fractal_rule": "Keep one model operation per file and aggregate through folder index.",
		"import_order": "1) model runtime libs; 2) @core aliases; 3) local llama modules; 4) type-only imports.",
		"naming_rules": "Functions use camelCase with explicit `get`/`load` prefixes.",
		"Same Code 1": "packages/polywise/src/llama/getModel.ts",
		"Same Code 2": "packages/polywise/src/llama/loadModel.ts",
		"sample_pool": ["packages/polywise/src/llama/getModelContext.ts", "packages/polywise/src/llama/index.ts"]
	},
	"src/pipeline/getChunks": {
		"path_scope": "packages/polywise/src/pipeline/getChunks",
		"description": "Chunking domain with semantic/split strategies.",
		"fractal_rule": "Keep folder `index.ts` as strategy dispatcher and split strategy logic into sibling files/subfolders.",
		"import_order": "1) @core aliases; 2) local chunk helpers; 3) type-only imports.",
		"naming_rules": "Chunk helpers use camelCase names aligned with strategy semantics.",
		"Same Code 1": "packages/polywise/src/pipeline/getChunks/index.ts",
		"Same Code 2": "packages/polywise/src/pipeline/getChunks/getSplitChunks.ts",
		"sample_pool": [
			"packages/polywise/src/pipeline/getChunks/getSemanticChunks/index.ts",
			"packages/polywise/src/pipeline/getChunks/getSemanticChunks/getRawText.ts"
		]
	},
	"src/pipeline/getChunkWords": {
		"path_scope": "packages/polywise/src/pipeline/getChunkWords",
		"description": "Word extraction and token validation pipeline.",
		"fractal_rule": "Use folder `index.ts` as extraction entry and split validators/tokenizers into dedicated files.",
		"import_order": "1) third-party NLP libs; 2) local validator/tokenizer helpers; 3) type-only imports.",
		"naming_rules": "Validation helpers use `is*` prefixes and extractor steps use action names.",
		"Same Code 1": "packages/polywise/src/pipeline/getChunkWords/index.ts",
		"Same Code 2": "packages/polywise/src/pipeline/getChunkWords/isValidUnigram.ts",
		"sample_pool": [
			"packages/polywise/src/pipeline/getChunkWords/isValidBigram.ts",
			"packages/polywise/src/pipeline/getChunkWords/jieba.ts"
		]
	},
	"src/pipeline root": {
		"path_scope": "packages/polywise/src/pipeline",
		"description": "General pipeline atomic functions outside specialized subfolders.",
		"fractal_rule": "Keep one pipeline capability per file and aggregate public APIs via `pipeline/index.ts`.",
		"import_order": "1) @core aliases; 2) third-party libs; 3) local modules; 4) type-only imports.",
		"naming_rules": "Pipeline functions and files use camelCase.",
		"Same Code 1": "packages/polywise/src/pipeline/getVectors.ts",
		"Same Code 2": "packages/polywise/src/pipeline/getKeywords.ts",
		"sample_pool": [
			"packages/polywise/src/pipeline/getRewriteQuery.ts",
			"packages/polywise/src/pipeline/index.ts"
		]
	},
	"src/rpc/session": {
		"path_scope": "packages/polywise/src/rpc/session",
		"description": "Session domain RPC procedures and storage helpers.",
		"fractal_rule": "Keep each session operation as a single file and aggregate with `session/index.ts`; shared helpers stay under `session/utils`.",
		"import_order": "1) @core/db and shared libs; 2) trpc helper import; 3) session-local helpers; 4) type-only imports.",
		"naming_rules": "Procedure files use action camelCase (create/remove/rename/sort/move).",
		"Same Code 1": "packages/polywise/src/rpc/session/getList.ts",
		"Same Code 2": "packages/polywise/src/rpc/session/rename.ts",
		"sample_pool": [
			"packages/polywise/src/rpc/session/index.ts",
			"packages/polywise/src/rpc/session/utils/index.ts"
		]
	},
	"src/rpc/file": {
		"path_scope": "packages/polywise/src/rpc/file",
		"description": "File write/watch RPC procedures.",
		"fractal_rule": "Keep endpoint functions atomic and aggregate in `file/index.ts`.",
		"import_order": "1) @core aliases and third-party libs; 2) local rpc/file modules; 3) type-only imports.",
		"naming_rules": "File procedure names are verb-based camelCase.",
		"Same Code 1": "packages/polywise/src/rpc/file/write.ts",
		"Same Code 2": "packages/polywise/src/rpc/file/watch.ts",
		"sample_pool": ["packages/polywise/src/rpc/file/index.ts", "packages/polywise/src/rpc/search.ts"]
	},
	"src/rpc/provider": {
		"path_scope": "packages/polywise/src/rpc/provider",
		"description": "Provider-related RPC procedures.",
		"fractal_rule": "Keep provider endpoints minimal and aggregate through folder index.",
		"import_order": "1) @core aliases; 2) local provider rpc files; 3) type-only imports.",
		"naming_rules": "Procedures use camelCase and explicit endpoint naming.",
		"Same Code 1": "packages/polywise/src/rpc/provider/getAll.ts",
		"Same Code 2": "packages/polywise/src/rpc/provider/index.ts",
		"sample_pool": ["packages/polywise/src/consts/providers/index.ts", "packages/polywise/src/rpc/index.ts"]
	},
	"src/rpc/llama": {
		"path_scope": "packages/polywise/src/rpc/llama",
		"description": "Model download/status/progress RPC procedures for llama domain.",
		"fractal_rule": "Split endpoints by action and aggregate in folder index.",
		"import_order": "1) @core aliases; 2) local llama rpc modules; 3) type-only imports.",
		"naming_rules": "Endpoint file names use action camelCase.",
		"Same Code 1": "packages/polywise/src/rpc/llama/index.ts",
		"Same Code 2": "packages/polywise/src/rpc/llama/download.ts",
		"sample_pool": [
			"packages/polywise/src/rpc/llama/getStatus.ts",
			"packages/polywise/src/rpc/llama/progress.ts"
		]
	},
	"src/rpc root": {
		"path_scope": "packages/polywise/src/rpc",
		"description": "Root RPC procedures and router mounting.",
		"fractal_rule": "Domain logic lives in subfolders/files; root `rpc/index.ts` only wires router composition.",
		"import_order": "1) trpc helper and local endpoint imports; 2) type-only imports.",
		"naming_rules": "Root router exports remain concise and explicit.",
		"Same Code 1": "packages/polywise/src/rpc/index.ts",
		"Same Code 2": "packages/polywise/src/rpc/search.ts",
		"sample_pool": ["packages/polywise/src/rpc/save.ts", "packages/polywise/src/rpc/setActive.ts"]
	},
	"src/fst/agents/title": {
		"path_scope": "packages/polywise/src/fst/agents/title",
		"description": "Title agent and title-focused helper files.",
		"fractal_rule": "Keep `agent.ts` as model builder and colocate small title-domain helpers in same folder.",
		"import_order": "1) ai/zod libs; 2) local helpers; 3) type-only imports.",
		"naming_rules": "Agent builders use default export arrow functions and helper names use camelCase.",
		"Same Code 1": "packages/polywise/src/fst/agents/title/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/title/title.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/title/index.ts",
			"packages/polywise/src/fst/tools/title.ts"
		]
	},
	"src/fst/agents/superego": {
		"path_scope": "packages/polywise/src/fst/agents/superego",
		"description": "Superego extraction pipeline and supporting tools/types.",
		"fractal_rule": "Keep `agent.ts` as entry and split extraction/tools/types into dedicated sibling files.",
		"import_order": "1) ai/zod and @core aliases; 2) local superego helpers; 3) type-only imports.",
		"naming_rules": "Files use snake_case where established (`memory_tool.ts`), functions use camelCase.",
		"Same Code 1": "packages/polywise/src/fst/agents/superego/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/superego/extract.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/superego/memory_tool.ts",
			"packages/polywise/src/fst/agents/superego/wiki_tool.ts"
		]
	},
	"src/fst/agents/skill_creator": {
		"path_scope": "packages/polywise/src/fst/agents/skill_creator",
		"description": "Skill creator meta-agent and draft/default skill helpers.",
		"fractal_rule": "Keep one helper file per skill-creation concern and aggregate via index.",
		"import_order": "1) ai/zod and @core aliases; 2) local skill_creator helpers; 3) type-only imports.",
		"naming_rules": "Agent and helper names use camelCase; folder keeps snake_case.",
		"Same Code 1": "packages/polywise/src/fst/agents/skill_creator/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/skill_creator/createDraft.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/skill_creator/defaultSkill.ts",
			"packages/polywise/src/fst/agents/skill_creator/index.ts"
		]
	},
	"src/fst/agents/trim": {
		"path_scope": "packages/polywise/src/fst/agents/trim",
		"description": "Trim agent for context-preserving message truncation decisions.",
		"fractal_rule": "Keep `agent.ts` + operation helper + index export pattern.",
		"import_order": "1) ai/zod libs; 2) local trim helpers; 3) type-only imports.",
		"naming_rules": "Files remain concise and trim-domain specific.",
		"Same Code 1": "packages/polywise/src/fst/agents/trim/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/trim/trim.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/trim/index.ts",
			"packages/polywise/src/consts/prompts/getTrimPrompt.ts"
		]
	},
	"src/fst/agents/permission": {
		"path_scope": "packages/polywise/src/fst/agents/permission",
		"description": "Permission evaluation agent and permission formatting/extraction helpers.",
		"fractal_rule": "Keep agent entry and split helper responsibilities by file.",
		"import_order": "1) ai/zod and @core aliases; 2) local permission helpers; 3) type-only imports.",
		"naming_rules": "Action helpers use camelCase verbs (`check`, `approve`, `extract`).",
		"Same Code 1": "packages/polywise/src/fst/agents/permission/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/permission/check.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/permission/extract.ts",
			"packages/polywise/src/fst/agents/permission/format.ts"
		]
	},
	"src/fst/agents/audit": {
		"path_scope": "packages/polywise/src/fst/agents/audit",
		"description": "Audit agent and audit operation helper.",
		"fractal_rule": "Keep one agent builder and one action helper, then aggregate with index.",
		"import_order": "1) ai/zod and @core aliases; 2) local audit files; 3) type-only imports.",
		"naming_rules": "Audit entry names stay concise and action-focused.",
		"Same Code 1": "packages/polywise/src/fst/agents/audit/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/audit/audit.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/audit/index.ts",
			"packages/polywise/src/consts/prompts/getAuditPrompt.ts"
		]
	},
	"src/fst/agents/supervisor": {
		"path_scope": "packages/polywise/src/fst/agents/supervisor",
		"description": "Supervisor streaming-chaos monitoring and timer/state controls.",
		"fractal_rule": "Split stream lifecycle and similarity/time utilities by file, with `agent.ts` and `index.ts` as entry surfaces.",
		"import_order": "1) ai/zod and @core aliases; 2) local supervisor helpers; 3) type-only imports.",
		"naming_rules": "Helpers use clear action names (`startStream`, `checkChaos`, `stopStream`).",
		"Same Code 1": "packages/polywise/src/fst/agents/supervisor/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/supervisor/checkChaos.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/supervisor/startStream.ts",
			"packages/polywise/src/fst/agents/supervisor/stopStream.ts"
		]
	},
	"src/fst/agents/system": {
		"path_scope": "packages/polywise/src/fst/agents/system",
		"description": "System-level agent helpers for bash/fs/tool checks.",
		"fractal_rule": "Keep capability files isolated by concern and export via index.",
		"import_order": "1) @core aliases; 2) local system helpers; 3) type-only imports.",
		"naming_rules": "Helper files use concise domain names (`bash`, `fs`, `tool`).",
		"Same Code 1": "packages/polywise/src/fst/agents/system/index.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/system/tool.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/system/bash.ts",
			"packages/polywise/src/fst/agents/system/fs.ts"
		]
	},
	"src/fst/agents root": {
		"path_scope": "packages/polywise/src/fst/agents",
		"description": "Agent domain root export and shared agent conventions.",
		"fractal_rule": "Each agent keeps an isolated folder; root index only aggregates exports.",
		"import_order": "1) local agent folder exports; 2) type-only imports.",
		"naming_rules": "Agent folder names stay snake_case.",
		"Same Code 1": "packages/polywise/src/fst/agents/index.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/title/index.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/superego/index.ts",
			"packages/polywise/src/fst/agents/permission/index.ts"
		]
	},
	"src/fst/tools/edit": {
		"path_scope": "packages/polywise/src/fst/tools/edit",
		"description": "Edit tool implementation internals.",
		"fractal_rule": "Keep parser/apply/count/error helpers split by concern with folder index facade.",
		"import_order": "1) third-party libs; 2) local edit helpers; 3) type-only imports.",
		"naming_rules": "Utility helper names use camelCase and concise edit-domain semantics.",
		"Same Code 1": "packages/polywise/src/fst/tools/edit/index.ts",
		"Same Code 2": "packages/polywise/src/fst/tools/edit/apply.ts",
		"sample_pool": [
			"packages/polywise/src/fst/tools/edit/count.ts",
			"packages/polywise/src/fst/tools/edit/error.ts"
		]
	},
	"src/fst/tools/skill": {
		"path_scope": "packages/polywise/src/fst/tools/skill",
		"description": "Skill tool domain for search/read/create/update/rebuild flows.",
		"fractal_rule": "Use folder `index.ts` as public tool entry and split operation handlers by action.",
		"import_order": "1) ai/zod and @core aliases; 2) local skill operation files; 3) type-only imports.",
		"naming_rules": "Action files use concise camelCase operation names.",
		"Same Code 1": "packages/polywise/src/fst/tools/skill/index.ts",
		"Same Code 2": "packages/polywise/src/fst/tools/skill/execute.ts",
		"sample_pool": [
			"packages/polywise/src/fst/tools/skill/rebuild.ts",
			"packages/polywise/src/fst/tools/skill/search.ts"
		]
	},
	"src/fst/tools/meta": {
		"path_scope": "packages/polywise/src/fst/tools/meta",
		"description": "Custom tool routing domain for search/read/create/remove/execute/build.",
		"fractal_rule": "Keep `meta/index.ts` as main tool entry and operation handlers in sibling files.",
		"import_order": "1) ai/zod and third-party libs; 2) local meta operation files; 3) type-only imports.",
		"naming_rules": "Operation helper files use camelCase names and explicit verbs.",
		"Same Code 1": "packages/polywise/src/fst/tools/meta/index.ts",
		"Same Code 2": "packages/polywise/src/fst/tools/meta/createCustomToolSet.ts",
		"sample_pool": [
			"packages/polywise/src/fst/tools/meta/rebuild.ts",
			"packages/polywise/src/fst/tools/meta/read.ts"
		]
	},
	"src/fst/tools root": {
		"path_scope": "packages/polywise/src/fst/tools",
		"description": "System tools and tool factory exports outside specialized subfolders.",
		"fractal_rule": "Keep one tool capability per file; aggregate through `tools/index.ts`.",
		"import_order": "1) ai/zod and @core aliases; 2) local tool files; 3) type-only imports.",
		"naming_rules": "Tool factories use `createXxxTool` convention where applicable.",
		"Same Code 1": "packages/polywise/src/fst/tools/memory.ts",
		"Same Code 2": "packages/polywise/src/fst/tools/context.ts",
		"sample_pool": ["packages/polywise/src/fst/tools/message.ts", "packages/polywise/src/fst/tools/index.ts"]
	},
	"src/fst/session/context": {
		"path_scope": "packages/polywise/src/fst/session/context",
		"description": "Session context read/write helpers.",
		"fractal_rule": "Keep get/set operations split and aggregate with folder index.",
		"import_order": "1) @core aliases; 2) local context helpers; 3) type-only imports.",
		"naming_rules": "Files use verb-based names (`getContext`, `setContext`).",
		"Same Code 1": "packages/polywise/src/fst/session/context/getContext.ts",
		"Same Code 2": "packages/polywise/src/fst/session/context/setContext.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/context/index.ts",
			"packages/polywise/src/fst/session/state/index.ts"
		]
	},
	"src/fst/session/message": {
		"path_scope": "packages/polywise/src/fst/session/message",
		"description": "Single-message insert/append operations.",
		"fractal_rule": "Keep message operations split by insertion mode and aggregate with index.",
		"import_order": "1) @core aliases; 2) local message helpers; 3) type-only imports.",
		"naming_rules": "Action names use camelCase verbs.",
		"Same Code 1": "packages/polywise/src/fst/session/message/appendMessage.ts",
		"Same Code 2": "packages/polywise/src/fst/session/message/insertMessage.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/message/index.ts",
			"packages/polywise/src/fst/session/messages/index.ts"
		]
	},
	"src/fst/session/messages": {
		"path_scope": "packages/polywise/src/fst/session/messages",
		"description": "Bulk message lifecycle operations (load/trim/clear/archive/unarchive).",
		"fractal_rule": "Keep each lifecycle operation in one file and aggregate via index.",
		"import_order": "1) @core aliases; 2) local message modules; 3) type-only imports.",
		"naming_rules": "Files use action-first camelCase names.",
		"Same Code 1": "packages/polywise/src/fst/session/messages/loadMessages.ts",
		"Same Code 2": "packages/polywise/src/fst/session/messages/trimMessages.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/messages/getMessages.ts",
			"packages/polywise/src/fst/session/messages/index.ts"
		]
	},
	"src/fst/session/related": {
		"path_scope": "packages/polywise/src/fst/session/related",
		"description": "Session-related entity loading (agents/project/model/data).",
		"fractal_rule": "One related entity fetch helper per file plus index aggregation.",
		"import_order": "1) @core aliases; 2) local related helpers; 3) type-only imports.",
		"naming_rules": "Related loaders use `get*` names.",
		"Same Code 1": "packages/polywise/src/fst/session/related/getData.ts",
		"Same Code 2": "packages/polywise/src/fst/session/related/getModel.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/related/getAgents.ts",
			"packages/polywise/src/fst/session/related/index.ts"
		]
	},
	"src/fst/session/session": {
		"path_scope": "packages/polywise/src/fst/session/session",
		"description": "Session record initialization/read/update helpers.",
		"fractal_rule": "Keep session lifecycle operations split by action and aggregate in folder index.",
		"import_order": "1) @core aliases; 2) local session helpers; 3) type-only imports.",
		"naming_rules": "Session lifecycle files use explicit action names.",
		"Same Code 1": "packages/polywise/src/fst/session/session/initSession.ts",
		"Same Code 2": "packages/polywise/src/fst/session/session/updateSession.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/session/getSession.ts",
			"packages/polywise/src/fst/session/session/index.ts"
		]
	},
	"src/fst/session/state": {
		"path_scope": "packages/polywise/src/fst/session/state",
		"description": "Session state file get/set operations.",
		"fractal_rule": "Keep state operations split into get/set files with a thin index.",
		"import_order": "1) @core aliases; 2) local state helpers; 3) type-only imports.",
		"naming_rules": "State helpers use `getState`/`setState` naming.",
		"Same Code 1": "packages/polywise/src/fst/session/state/getState.ts",
		"Same Code 2": "packages/polywise/src/fst/session/state/setState.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/state/index.ts",
			"packages/polywise/src/fst/session/context/index.ts"
		]
	},
	"src/fst/session/stream": {
		"path_scope": "packages/polywise/src/fst/session/stream",
		"description": "Session stream start/get/abort flow.",
		"fractal_rule": "Keep stream control operations split by action and aggregate in folder index.",
		"import_order": "1) @core and ai libs; 2) local stream helpers; 3) type-only imports.",
		"naming_rules": "Stream helpers use action-first camelCase.",
		"Same Code 1": "packages/polywise/src/fst/session/stream/getStream.ts",
		"Same Code 2": "packages/polywise/src/fst/session/stream/abortStream.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/stream/index.ts",
			"packages/polywise/src/fst/agents/supervisor/startStream.ts"
		]
	},
	"src/fst/session/task": {
		"path_scope": "packages/polywise/src/fst/session/task",
		"description": "Session task list get/set/clear operations.",
		"fractal_rule": "Keep each task operation atomic and expose through folder index.",
		"import_order": "1) @core aliases; 2) local task helpers; 3) type-only imports.",
		"naming_rules": "Task helpers use clear action names.",
		"Same Code 1": "packages/polywise/src/fst/session/task/getTasks.ts",
		"Same Code 2": "packages/polywise/src/fst/session/task/setTasks.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/task/clearTasks.ts",
			"packages/polywise/src/fst/session/task/index.ts"
		]
	},
	"src/fst/session/utils": {
		"path_scope": "packages/polywise/src/fst/session/utils",
		"description": "Session runtime utility helpers (active/stop/sync/abort handling).",
		"fractal_rule": "Keep runtime toggles isolated and aggregate via folder index.",
		"import_order": "1) @core aliases; 2) local utils; 3) type-only imports.",
		"naming_rules": "Runtime controls use concise verb names.",
		"Same Code 1": "packages/polywise/src/fst/session/utils/stop.ts",
		"Same Code 2": "packages/polywise/src/fst/session/utils/sync.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/utils/active.ts",
			"packages/polywise/src/fst/session/utils/index.ts"
		]
	},
	"src/fst/session root": {
		"path_scope": "packages/polywise/src/fst/session",
		"description": "Session class orchestration root.",
		"fractal_rule": "Session class in root file delegates concrete operations to dedicated subfolders.",
		"import_order": "1) node/third-party libs; 2) @core aliases; 3) session subfolder imports; 4) type-only imports.",
		"naming_rules": "Session root class keeps explicit method forwarding pattern.",
		"Same Code 1": "packages/polywise/src/fst/session/index.ts",
		"Same Code 2": "packages/polywise/src/fst/session/session/index.ts",
		"sample_pool": [
			"packages/polywise/src/fst/session/messages/index.ts",
			"packages/polywise/src/fst/session/stream/index.ts"
		]
	},
	"src/fst/telemetry": {
		"path_scope": "packages/polywise/src/fst/telemetry",
		"description": "Telemetry collection, failure search, and patch record management.",
		"fractal_rule": "Keep each telemetry concern in a dedicated file and aggregate from `telemetry/index.ts`.",
		"import_order": "1) @core aliases; 2) third-party libs; 3) local telemetry helpers; 4) type-only imports.",
		"naming_rules": "Telemetry files use action-focused camelCase names.",
		"Same Code 1": "packages/polywise/src/fst/telemetry/collectFailureEvent.ts",
		"Same Code 2": "packages/polywise/src/fst/telemetry/upsertPatchRecord.ts",
		"sample_pool": [
			"packages/polywise/src/fst/telemetry/searchFailureCases.ts",
			"packages/polywise/src/fst/telemetry/index.ts"
		]
	},
	"src/fst/utils/getBashTools": {
		"path_scope": "packages/polywise/src/fst/utils/getBashTools",
		"description": "Bash tool command auditing and execution helper cluster.",
		"fractal_rule": "Keep command parsing/matching/execution stages in dedicated files with index facade.",
		"import_order": "1) third-party libs; 2) @core aliases; 3) local bash-tool helpers; 4) type-only imports.",
		"naming_rules": "Helper names use explicit verb phrases.",
		"Same Code 1": "packages/polywise/src/fst/utils/getBashTools/index.ts",
		"Same Code 2": "packages/polywise/src/fst/utils/getBashTools/executeCommand.ts",
		"sample_pool": [
			"packages/polywise/src/fst/utils/getBashTools/getMatchedRules.ts",
			"packages/polywise/src/fst/utils/getBashTools/getCleanCommand.ts"
		]
	},
	"src/fst/utils/system": {
		"path_scope": "packages/polywise/src/fst/utils/system",
		"description": "System command inventory/rules/spec generation helpers.",
		"fractal_rule": "Keep each system helper isolated and aggregate through folder index.",
		"import_order": "1) local system helper imports; 2) @core aliases; 3) type-only imports.",
		"naming_rules": "Helpers use `get*`/`create*`/`has*` prefixes.",
		"Same Code 1": "packages/polywise/src/fst/utils/system/createSystemSpec.ts",
		"Same Code 2": "packages/polywise/src/fst/utils/system/getCommandRules.ts",
		"sample_pool": [
			"packages/polywise/src/fst/utils/system/getPresetCommands.ts",
			"packages/polywise/src/fst/utils/system/index.ts"
		]
	},
	"src/fst/utils root": {
		"path_scope": "packages/polywise/src/fst/utils",
		"description": "General FST utility functions outside deeper utils subfolders.",
		"fractal_rule": "Keep utility atoms single-purpose and export through `fst/utils/index.ts`.",
		"import_order": "1) @core aliases; 2) local helpers; 3) type-only imports.",
		"naming_rules": "Utility helpers use camelCase and descriptive verbs.",
		"Same Code 1": "packages/polywise/src/fst/utils/checkPermission.ts",
		"Same Code 2": "packages/polywise/src/fst/utils/getRealPath.ts",
		"sample_pool": ["packages/polywise/src/fst/utils/index.ts", "packages/polywise/src/fst/utils/safeshell.ts"]
	},
	"src/fst root": {
		"path_scope": "packages/polywise/src/fst",
		"description": "FST root-level exports and provider/clean orchestration.",
		"fractal_rule": "Root files define lightweight orchestration and delegate heavy logic into subfolders.",
		"import_order": "1) third-party libs; 2) @core aliases; 3) local fst modules; 4) type-only imports.",
		"naming_rules": "Root exports remain compact and explicit.",
		"Same Code 1": "packages/polywise/src/fst/index.ts",
		"Same Code 2": "packages/polywise/src/fst/provider.ts",
		"sample_pool": ["packages/polywise/src/fst/clean.ts", "packages/polywise/src/fst/types.ts"]
	},
	"src/utils/rstream": {
		"path_scope": "packages/polywise/src/utils/rstream",
		"description": "Reactive stream utility cluster.",
		"fractal_rule": "Keep stream helpers grouped and exposed via folder index.",
		"import_order": "1) third-party libs; 2) local rstream files; 3) type-only imports.",
		"naming_rules": "Helpers use clear stream semantics.",
		"Same Code 1": "packages/polywise/src/utils/rstream/index.ts",
		"Same Code 2": "packages/polywise/src/utils/rstream/getPubSub.ts",
		"sample_pool": ["packages/polywise/src/utils/session.ts", "packages/polywise/src/utils/log.ts"]
	},
	"src/utils root": {
		"path_scope": "packages/polywise/src/utils",
		"description": "General runtime utilities and shared infrastructure helpers.",
		"fractal_rule": "Keep utility atoms small, capability-focused, and aggregated in `utils/index.ts`.",
		"import_order": "1) third-party libs; 2) @core aliases; 3) local utils; 4) type-only imports.",
		"naming_rules": "Function files use camelCase; keep established snake_case names when already public API.",
		"Same Code 1": "packages/polywise/src/utils/connectSession.ts",
		"Same Code 2": "packages/polywise/src/utils/trpc.ts",
		"sample_pool": ["packages/polywise/src/utils/initServer.ts", "packages/polywise/src/utils/index.ts"]
	},
	"src/types": {
		"path_scope": "packages/polywise/src/types",
		"description": "Cross-domain type definitions and re-exports.",
		"fractal_rule": "Keep type domains split by concern and aggregate through `types/index.ts`.",
		"import_order": "1) type-only imports from libs; 2) local type modules.",
		"naming_rules": "Type aliases/interfaces use PascalCase; exported type constants follow existing style.",
		"Same Code 1": "packages/polywise/src/types/config.ts",
		"Same Code 2": "packages/polywise/src/types/index.ts",
		"sample_pool": ["packages/polywise/src/types/pipeline.ts", "packages/polywise/src/types/llm.ts"]
	}
}
```
