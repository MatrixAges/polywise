# Code Style Routing (packages/polywise)

This file is the style routing table for `packages/polywise`. Before any implementation or refactor, route to a node, read both Same Code samples, then apply clone-first coding.

## Tree JSON Routing Table

```json
{
	"Pipeline Atomic Functions": {
		"description": "Implements retrieval/extraction pipeline atoms and small orchestrators.",
		"fractal_rule": "Keep simple atoms in single files under src/pipeline/. When one atom grows into multiple internal steps, split into same-name folder with index.ts as scheduler.",
		"import_order": "1) @core aliases; 2) third-party libs; 3) relative modules; 4) type-only imports.",
		"naming_rules": "Function and file names use camelCase. Ordinary variables use snake_case.",
		"Same Code 1": "packages/polywise/src/pipeline/getChunks/index.ts",
		"Same Code 2": "packages/polywise/src/pipeline/getVectors.ts",
		"sample_pool": [
			"packages/polywise/src/pipeline/getKeywords.ts",
			"packages/polywise/src/pipeline/getRewriteQuery.ts"
		]
	},
	"IO Search and Save Flows": {
		"description": "Owns business-domain save/search workflows built from lower-level pipeline and db services.",
		"fractal_rule": "Use domain folders under src/io/. Keep index.ts as orchestration entry and split sub-steps into adjacent files or subfolders.",
		"import_order": "1) @core aliases; 2) third-party libs; 3) relative modules; 4) type-only imports.",
		"naming_rules": "Functions use camelCase. Input/output aliases use PascalCase. Variables use snake_case.",
		"Same Code 1": "packages/polywise/src/io/search/index.ts",
		"Same Code 2": "packages/polywise/src/io/save/index.ts",
		"sample_pool": ["packages/polywise/src/io/search/lookup.ts", "packages/polywise/src/io/save/saveArticle.ts"]
	},
	"RPC Procedures": {
		"description": "Defines tRPC procedures and routers exposed by polywise runtime.",
		"fractal_rule": "Keep rpc/* files atomic by endpoint intent. Group related session/file/provider endpoints in subdirectories.",
		"import_order": "1) @core aliases and zod/drizzle libs; 2) shared trpc helper imports; 3) relative rpc-local modules; 4) type-only imports.",
		"naming_rules": "Procedure files use camelCase. Zod schemas use snake_case constants when already established. Export default per procedure file.",
		"Same Code 1": "packages/polywise/src/rpc/search.ts",
		"Same Code 2": "packages/polywise/src/rpc/session/getList.ts",
		"sample_pool": ["packages/polywise/src/rpc/file/write.ts", "packages/polywise/src/rpc/provider/getAll.ts"]
	},
	"Database Schemas": {
		"description": "Defines drizzle table schemas and index declarations.",
		"fractal_rule": "One table per schema file under src/db/schema/. Keep relationship imports shallow and local.",
		"import_order": "1) drizzle imports; 2) utility/id imports; 3) relative schema references; 4) type-only imports.",
		"naming_rules": "Schema variables use camelCase. Column fields use snake_case to match DB contract.",
		"Same Code 1": "packages/polywise/src/db/schema/article.ts",
		"Same Code 2": "packages/polywise/src/db/schema/node.ts",
		"sample_pool": ["packages/polywise/src/db/schema/edge.ts", "packages/polywise/src/db/schema/session.ts"]
	},
	"Database Service Functions": {
		"description": "Wraps DB operations into reusable service-level atoms.",
		"fractal_rule": "One service file per domain aggregate under src/db/services/. Keep each export function focused and composable.",
		"import_order": "1) @core/db schema and env; 2) drizzle helpers; 3) type-only imports.",
		"naming_rules": "Service functions use camelCase with verb prefixes (get/add/update/remove).",
		"Same Code 1": "packages/polywise/src/db/services/node.ts",
		"Same Code 2": "packages/polywise/src/db/services/article.ts",
		"sample_pool": [
			"packages/polywise/src/db/services/message.ts",
			"packages/polywise/src/db/services/session.ts"
		]
	},
	"FST Agents": {
		"description": "Defines internal ToolLoopAgent builders and agent-specific orchestration boundaries.",
		"fractal_rule": "Each agent owns its own folder under src/fst/agents/<name>/. Keep agent.ts as primary entry and split helper logic only when needed.",
		"import_order": "1) ai/zod and model-related libs; 2) @core aliases; 3) local agent helpers; 4) type-only imports.",
		"naming_rules": "Agent folders use snake_case. Agent factory exports use default anonymous arrow functions where already adopted.",
		"Same Code 1": "packages/polywise/src/fst/agents/title/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/superego/agent.ts",
		"sample_pool": [
			"packages/polywise/src/fst/agents/trim/agent.ts",
			"packages/polywise/src/fst/agents/permission/agent.ts"
		]
	},
	"FST Tool Factories": {
		"description": "Defines tool factories and schema contracts used by FST session runtime.",
		"fractal_rule": "Keep one tool capability per file in src/fst/tools/. For complex domains, use subdirectories with index.ts as the public entry.",
		"import_order": "1) ai/zod and @core aliases; 2) local tool helpers; 3) type-only imports.",
		"naming_rules": "Factory names use createXxxTool. Files use camelCase or existing established naming in the folder.",
		"Same Code 1": "packages/polywise/src/fst/tools/memory.ts",
		"Same Code 2": "packages/polywise/src/fst/tools/context.ts",
		"sample_pool": [
			"packages/polywise/src/fst/tools/skill/index.ts",
			"packages/polywise/src/fst/tools/meta/index.ts"
		]
	},
	"Prompt Builders": {
		"description": "Defines pure prompt-building functions under consts/prompts.",
		"fractal_rule": "One prompt builder per file. Keep them pure and free of session/runtime side effects.",
		"import_order": "1) type-only imports; 2) local constant/function usage.",
		"naming_rules": "Files use getXxxPrompt.ts. Export default single builder function.",
		"Same Code 1": "packages/polywise/src/consts/prompts/getSkillPrompt.ts",
		"Same Code 2": "packages/polywise/src/consts/prompts/getTitlePrompt.ts",
		"sample_pool": [
			"packages/polywise/src/consts/prompts/getContextPrompt.ts",
			"packages/polywise/src/consts/prompts/getTrimPrompt.ts"
		]
	}
}
```
