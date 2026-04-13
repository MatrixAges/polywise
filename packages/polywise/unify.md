# Code Style Routing (Unify Rules)

This file defines code style and module fractal structure constraints within the `polywise` core engine package. Before generating code, the Agent must read this JSON, find the target node's `fractal_rule` (fractal and directory depth rules) and `Same Code` samples, and perform clone-style coding.

## Tree JSON Routing Table

```json
{
	"Pipeline Action (Pipeline Atomic Functions)": {
		"description": "Pure functions or aggregation entries that handle knowledge base core business pipeline (chunking, vectorization, retrieval, etc.).",
		"fractal_rule": "Follow natural fractal growth rules:\n1. Simple atomic functions are defined directly as single files (e.g., `getVectors.ts`).\n2. When single file logic exceeds 40 lines, or multiple sub-steps need to collaborate internally (e.g., chunking functionality has both semantic chunking and symbolic chunking), forcibly create a new folder with the same name (e.g., `getChunks/`), store the main logic as the overall scheduling entry in `index.ts`, and store other split-out atomic functions in the same-level directory (e.g., `getSemanticChunks.ts`, `getSplitChunks.ts`), introduced and scheduled only by `index.ts`.\n3. All related auxiliary types and configuration items, if complex, should also converge to that same-level directory.",
		"export_style": "Must use anonymous arrow functions as default exports: `export default async (args) => {}`. If parameters exceed 2, they must be encapsulated as an object and destructured on the first line.",
		"naming_rules": "Function and file names一律 use camelCase.",
		"Same Code 1": "packages/polywise/src/pipeline/getChunks/index.ts",
		"Same Code 2": "packages/polywise/src/pipeline/getVectors.ts"
	},
	"Database SQL (Pure SQL Operations)": {
		"description": "Stores native SQL statements or pure functions for assembling SQL. Business models cannot hardcode SQL.",
		"fractal_rule": "Split files by database table name (e.g., `nodes.ts`, `edges.ts`) stored in `src/sql/`. For complex cross-table queries, new files can be created based on business domain.",
		"export_style": "Must be exposed through on-demand exports `export const sql_insert_node = ...`. Default export is strictly prohibited.",
		"comments_rule": "Mandatory JSDoc comments, detailing the table and business function of the current SQL operation.",
		"Same Code 1": "packages/polywise/src/sql/nodes.ts"
	},
	"Database Model (Data Models)": {
		"description": "Business models responsible for scheduling SQL execution and performing data transformation.",
		"fractal_rule": "Split by business domain into independent files (e.g., `NodeModel.ts`) stored in `src/models/`. If model responsibilities grow, split into basic models (read-write separation), etc.",
		"export_style": "Default export class.",
		"dependency_injection": "No strong injection, but must uniformly depend on `sqlite` executor instance.",
		"Same Code 1": "packages/polywise/src/models/NodeModel.ts"
	},
	"FST Agent (Internal Decision Agents)": {
		"description": "Internal agents used by the FST system for decision-making, observation, and consolidation. Each agent is a ToolLoopAgent with its own tools and system prompt.",
		"fractal_rule": "Each agent lives in its own directory under `fst/agents/<name>/`. Structure: agent.ts (ToolLoopAgent creation), getPrompt.ts (system prompt builder), index.ts (barrel export). Complex agents may include additional files for tool creation (e.g., memory_tool.ts, wiki_tool.ts) and orchestration (e.g., process.ts).",
		"export_style": "agent.ts must default export a factory function: `export default (model, session, ...args) => ToolLoopAgent`. index.ts re-exports with named exports.",
		"naming_rules": "Agent directories use snake_case. Tool files use snake_case suffix (e.g., memory_tool.ts). Internal functions use camelCase.",
		"Same Code 1": "packages/polywise/src/fst/agents/superego/agent.ts",
		"Same Code 2": "packages/polywise/src/fst/agents/title/agent.ts"
	},
	"FST Tool (Session-Level Tools)": {
		"description": "Tools exposed to the main agent during stream execution. Each tool wraps a specific capability (search, edit, memory, wiki, etc.).",
		"fractal_rule": "Each tool is a single file in `fst/tools/` exporting a named `createXxxTool(session)` factory function. Tools with complex logic can split into sub-files but maintain a single entry point.",
		"export_style": "Named export: `export const createXxxTool = (session) => tool({...})`. Uses `tool()` from 'ai' SDK. Input schema defined via Zod.",
		"naming_rules": "File names use camelCase (e.g., memory.ts, wiki.ts). Factory function name: create + PascalCase + Tool.",
		"Same Code 1": "packages/polywise/src/fst/tools/memory.ts",
		"Same Code 2": "packages/polywise/src/fst/tools/context.ts"
	}
}
```
