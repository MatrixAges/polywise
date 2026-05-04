# Agent Map

This document provides an overview of the packages/polywise module structure and architecture.

## 1. Module Overview

- **Description**: Build with AI, Build for AI - Neuroscience-inspired knowledge graph and memory system
- **Architecture**: SQLite + TypeScript

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/polywise",
	"structure": {
		".test": {
			"check-search-consts.mjs": {
				"desc": "Verifies search thresholds and weights are centralized in src/consts/search.ts and imported by search modules",
				"role": "Test Script"
			},
			"check-semantic-filter.mjs": {
				"desc": "Validates light semantic boost correction and relative-threshold filtering behavior",
				"role": "Test Script"
			},
			"check-answer-weight.mjs": {
				"desc": "Confirms search_answer vector branch remains enabled with lower RRF weight than primary retrieval branches",
				"role": "Test Script"
			},
			"check-article-time-weight.mjs": {
				"desc": "Checks article ranking uses relevance plus time decay instead of pure updated_at sorting",
				"role": "Test Script"
			},
			"loadDatasetText.mjs": {
				"desc": "Loads dataset fixtures from packages/polywise/datasets for functional Node-based tests",
				"role": "Test Utility"
			},
			"createRuntime.mjs": {
				"desc": "Starts an isolated Node-driven polywise runtime and exposes save/search/update helpers for functional tests",
				"role": "Test Utility"
			},
			"functional-basic-search.mjs": {
				"desc": "Runs end-to-end save and article search assertions against stable Atoms and React dataset queries",
				"role": "Test Script"
			},
			"functional-time-weight-search.mjs": {
				"desc": "Runs end-to-end article ranking checks for near-equal documents to verify time weighting behavior",
				"role": "Test Script"
			},
			"functional-update-reindex-search.mjs": {
				"desc": "Runs end-to-end update and reindex checks to verify replaced article content changes search outcomes",
				"role": "Test Script"
			},
			"functional-keyword-no-bypass.mjs": {
				"desc": "Uses inspector branch overrides to verify keyword hits still pass semantic filtering and keyword-only mismatches do not bypass into final results",
				"role": "Test Script"
			},
			"functional-answer-branch-lower-weight.mjs": {
				"desc": "Uses inspector branch overrides to verify answer retrieval participates while remaining below the primary question branch in final ranking",
				"role": "Test Script"
			}
		},
		"datasets": {
			"triple_cn_1.ts": { "desc": "Technology and Business History test data (CN)", "role": "Data" },
			"triple_cn_2.ts": { "desc": "History and Geography test data (CN)", "role": "Data" },
			"triple_cn_3.ts": { "desc": "Science and Biology test data (CN)", "role": "Data" },
			"triple_cn_4.ts": { "desc": "Literature and Culture test data (CN)", "role": "Data" },
			"triple_cn_5.ts": { "desc": "Space and Exploration test data (CN)", "role": "Data" },
			"triple_en_1.ts": { "desc": "Physics and Science test data (EN)", "role": "Data" },
			"triple_en_2.ts": { "desc": "Tech Companies and Business test data (EN)", "role": "Data" },
			"triple_en_3.ts": { "desc": "History and Global Conflict test data (EN)", "role": "Data" },
			"triple_en_4.ts": { "desc": "Geography and Ecology test data (EN)", "role": "Data" },
			"triple_en_5.ts": { "desc": "Entertainment and Media test data (EN)", "role": "Data" }
		},
		"src": {
			"config": {
				"desc": "Runtime config loading and watch lifecycle. loadConfig hydrates in-memory config/providers from ~/.polywise, backfills missing fields on existing preset provider entries from preset defaults, and still auto-appends any missing preset providers into providers.json; initConfig wires Watchpack change/remove recovery around config.json and providers.json.",
				"role": "Folder"
			},
			"api": {
				"index.ts": { "desc": "Hono API entry with tRPC and custom handlers", "role": "Index" },
				"chat.ts": { "desc": "Chat API handler exposing fst capabilities", "role": "Endpoint" },
				"session/connectSession.ts": {
					"desc": "Shared session connect helper for API/session consumers",
					"role": "Utility"
				}
			},
			"fst": {
				"index.ts": { "desc": "fst module exports", "role": "Index" },
				"chat": { "desc": "Chat capabilities using AI SDK, supporting UIMessages", "role": "Folder" },
				"session": {
					"desc": "Session lifecycle and stream orchestration for chat and cron-triggered runs, consuming skill_map loading from fst/tools/skill and title_tool-based session renaming; skill_map is normalized to name + description only, with skill file paths derived from skill name at runtime; supports archive/unarchive flow with archived_at state persisted in session_dir/state.json and message queries scoped by archived boundary; appendMessage persists messages to database only, and trim/title/superego extraction are deferred after stream finish; successful stream completion now also resets is_runing through stop() so follow-up user messages are inserted normally; session_dir/config.json stores disable_map and mode (normal|plan|plan-exec); plan mode disables write_file/edit_file tools and injects plan prompt; plan-exec mode auto-sends execution message after plan completes and resets mode to normal; clears session_dir/plan.md on message clear or archive",
					"role": "Folder"
				},
				"agents": {
					"desc": "Internal decision agents for permission, audit, system operations, AI-generated session titles, superego cognitive consolidation, Hermes-style skill creator meta-drafting, and context-preserving message trimming",
					"role": "Folder",
					"superego": {
						"desc": "Background cognitive observer (Superego Agent) that asynchronously extracts episodic memories, semantic knowledge, and procedural skills from conversation turns; triggered after 3 append messages or via superego_tool; now consumes stream-level complexity signals, queries the shared fst/telemetry domain for patch suggestions and related failures, invokes a dedicated skill_creator meta-agent with strict existing-skill patch priority, and then uses local skill create/update support to write /skills/<skill-name>/SKILL.md and rebuild a skill_map that stores only name + description while runtime lookup derives file paths from skill name; conversation extraction now strips tool transcripts, XML-like file dump wrappers, and runtime reminders before prompting, and invalid structured output safely falls back to skipped instead of leaking raw agent text; supervisor chaos detection now buffers stream deltas into larger text blocks and only runs after the configured time window instead of immediately on short repeated deltas",
						"role": "Folder"
					},
					"skill_creator": {
						"desc": "Hermes-style meta-skill drafting agent that converts complex workflows, repeated failures, and missing recovery paths into generalized local skill drafts with progressive-disclosure descriptions and structured markdown sections; now receives existing-skill match info and patch suggestion level so update is forced ahead of create when a relevant skill already exists",
						"role": "Folder"
					},
					"trim": {
						"desc": "Context-preserving trim agent that analyzes trimmed messages vs remaining messages and current context to determine if crucial information would be lost; outputs updated context fields if needed",
						"role": "Folder"
					}
				},
				"utils": {
					"desc": "fst execution helpers for permission checks, bash sandbox orchestration, response shaping, and shell safety",
					"role": "Folder",
					"getBashTools": "Sandbox-backed bash tool builder with command risk matching, audit review, and child_process proxy execution for flagged commands"
				},
				"tools": {
					"desc": "Bash sandboxing tools via bash-tool, local skill search/read/create/update/rebuild tooling plus Available Skills system-prompt summary injection, with skill_map persisted as name + description only and skill_tool resolving directory and SKILL.md paths from skill name at runtime; global custom tool routing and lazy-loading via meta_tool as the only bridge for custom tool execution, session-scoped plan management, session database message search by content and created_at range, read-only memory/wiki search tools with superego trigger, and search_file_tool now reusing the shared utils/grep ripgrep wrapper while still honoring virtual workspace path mapping and permission checks, normalizing absolute match filenames back into virtual paths and returning absolute_path-rich results without shell command assembly or fallback grep branches; initDefaults now also ensures app_path/patch exists and seeds a built-in skills/skill-creator/SKILL.md meta-skill, while error_collect_tool records raw tool_call_errors and links failure-like outputs into telemetry patch aggregation",
					"role": "Folder",
					"cron.ts": "Create/list/read/update/remove cron jobs backed by app.app_path/cron.json with incremental runtime reload and physical directory removal",
					"meta": "Manage global custom tool routing, rebuild minimal custom_tools_map metadata with name and description only, resolve per-tool readme.md and index.mjs paths from tools_dir + name at runtime, expose fuzzy search/read/execute/create/remove actions, return input_schema only from read/search by dynamically loading each tool module, and lazily execute per-tool index.mjs modules only through meta_tool bridge with z.fromJSONSchema-based input validation",
					"title.ts": "Internal tool that generates and updates session titles while protecting manually edited titles; title/running/unread status changes emit through rpc/session/watchSessionStatus for realtime menu sync",
					"memory.ts": "Read-only memory search tool for main agent; search episodic memories by query with scope filtering",
					"message.ts": "Conversation history tool supporting total count, context count, previous message reads, and database content search with required object-based inclusive date range schema for Gemini-compatible tool calling",
					"plan.ts": "Manage session_dir/plan.md with save/get/clear actions; stores concise plan metadata, task breakdowns, mermaid execution flow, and delivery criteria",
					"wiki.ts": "Read-only wiki knowledge search tool for main agent; search semantic knowledge by query",
					"superego.ts": "Trigger tool that invokes superego agent to extract and persist information from conversation; only way for main agent to write to memory/wiki",
					"webfetch.ts": "Fetch URL content as Markdown (Jina primary, fetch+turndown fallback)",
					"websearch.ts": "Web search via DuckDuckGo HTML → turndown Markdown"
				},
				"telemetry": {
					"desc": "Shared FST telemetry domain for raw tool failure linkage, related-case grep search across tool_call_errors and patch daily files, patch suggestion leveling (observe|patch|escalate), and daily patch record upsert/write under app_path/patch",
					"role": "Folder"
				},
				"cron": {
					"desc": "Cron metadata store/runtime/logging backed by cron.json and Croner jobs, including session execution bridge",
					"role": "Folder"
				},
				"mcp": {
					"desc": "MCP client tools integration, including config loading, server filtering, startup prewarming, and tool bridging into session streams",
					"role": "Folder"
				},
				"acp": { "desc": "ACP provider integration", "role": "Folder" }
			},
			"rpc": {
				"desc": "tRPC router tree for API/state mutations and subscriptions, including session lifecycle, file persistence, provider/model runtime, and content operations; session router now includes dedicated single-file endpoints for create/remove/rename/pin and session-group management with pin.json + session_group.json persistence under app.app_path, while todo router now provides create/remove/sort/update plus query modes for standalone todos, project-scoped todos, and project-grouped todo lists",
				"role": "Folder",
				"index.ts": { "desc": "RPC routers aggregation and type export", "role": "Index" },
				"save.ts": { "desc": "Save content to memory", "role": "RPC" },
				"search.ts": {
					"desc": "Search RPC exposing keyword/vector/recall/rerank pipeline inputs without separate time-ranking mode",
					"role": "RPC"
				},
				"inspectSearch.ts": {
					"desc": "Test-only search inspection RPC exposing branch inputs, stage outputs, and deterministic branch overrides for functional validation",
					"role": "RPC"
				},
				"setActive.ts": { "desc": "Set active workspace/session state", "role": "RPC" },
				"remove.ts": { "desc": "Remove content by id", "role": "RPC" },
				"update.ts": { "desc": "Update content by id", "role": "RPC" },
				"heartbeat.ts": { "desc": "Heartbeat subscription endpoint", "role": "RPC" },
				"test.ts": { "desc": "Test RPC procedure", "role": "RPC" },
				"file": {
					"desc": "File JSON write/watch RPC endpoints backed by app.app_path plus filesystem homedir and current-level directory listing endpoints for UI directory pickers; file/list also supports optional hidden-entry filtering and directory-only results for directory selection flows",
					"role": "Folder"
				},
				"provider": {
					"desc": "Provider-related RPC endpoints",
					"role": "Folder"
				},
				"llama": {
					"desc": "Model download/progress/status RPC endpoints",
					"role": "Folder"
				},
				"session": {
					"desc": "Session subscriptions and management RPCs. Existing event bridge endpoints remain in events.ts; create/remove/rename/pin and group CRUD/sort/move, including moveOutGroup for removing a session id from a specific group by index, are split into dedicated single-file procedures. getList now returns grouped sessions by batch-loading group item ids and a separate first-page ungrouped session list, while getMoreList paginates additional ungrouped sessions in pages of 10 using the same group exclusion rule; both queries also exclude any session already linked through project_session so project-owned sessions never appear anywhere in the session page, and getList also excludes the reserved id global_panel_session from all query paths. A session/utils subtree now holds single-file storage helpers, normalization helpers, and shared SessionGroupItem typing, while pin.json and session_group.json path constants are centralized in consts/app.ts; rename persists human title intent into context.json so title_tool no longer overrides manually renamed sessions. Replaced title-only watch with watchSessionStatus subscription payload `{ [session_id]: { title, running, unread } }`, added unread mutation endpoint to clear unread on enter, and stream finish now marks unread=true when SessionEventStore has no `${id}/change` listeners. Session remove now enforces stream and event cleanup by aborting active session stream, unsubscribing SessionStreamStore, and clearing session-scoped SessionEventStore listeners before final store/file removal.",
					"role": "Folder"
				},
				"project": {
					"desc": "Project domain RPC procedures for project list, project ordering, project-todo binding, and project file detail lookup. getList returns project/session/todo metadata without scanning project directories, and both getList/getMoreSessions paginate project-owned sessions in pages of 6; file trees are loaded on demand through rpc/file/list and file content through getFileDetail. Project sort now reorders against the ascending project list and reuses the shared arrayMove helper before persisting sequential order values. Project remove now cascades through project-linked sessions by reusing the shared session removal helper before deleting the project itself. Session CRUD for project usage is shared through the session router.",
					"role": "Folder"
				},
				"todo": {
					"desc": "Todo domain RPC procedures for standalone todos and project-bound todos, including creation, deletion, status/content updates, drag sorting within a status column or across status columns, direct project query, inbox/project menu count aggregation, visible-only grouped query views that exclude archive status, and global archive list pagination through getArchives/getMoreArchives with 10-item pages and has_more metadata across all archive-status todos. New todo creation now assigns an order before the current minimum so fresh items appear at the top in inbox and project views. Cross-column drag now also accepts missing over_id when dropping into an empty kanban column and inserts by target status.",
					"role": "Folder"
				}
			},
			"rpcs": {
				"index.ts": { "desc": "RPC routers aggregation and type export", "role": "Index" },
				"save.ts": { "desc": "Save content to memory", "role": "RPC" },
				"search.ts": { "desc": "Search with keywords/vector/rrf/rerank pipeline", "role": "RPC" },
				"setConfig.ts": { "desc": "Update configuration settings", "role": "RPC" },
				"setTask.ts": {
					"desc": "Set task state (cancel/pause/resume/retry/ignore/remove)",
					"role": "RPC"
				},
				"test.ts": { "desc": "Test RPC procedure", "role": "RPC" },
				"watchConfig.ts": { "desc": "Subscribe to config changes", "role": "RPC" },
				"watchTasks.ts": {
					"desc": "Subscribe to task status changes with optional type filter",
					"role": "RPC"
				}
			},
			"db": {
				"drizzle.ts": { "desc": "Database connection and drizzle instance", "role": "Module" },
				"index.ts": { "desc": "DB module exports", "role": "Index" },
				"schemas.ts": {
					"desc": "Reusable drizzle-zod input schemas derived from Drizzle tables; currently exports todo insert/create/update schemas for RPC reuse.",
					"role": "Schema"
				},
				"initSql.ts": { "desc": "Virtual table initialization", "role": "Module" },
				"migrate.ts": { "desc": "Migration runner", "role": "Module" },
				"prepare.ts": {
					"desc": "Prepared sqlite/sqlite-vec search statements with centralized search constant limits",
					"role": "Module"
				},
				"schema": {
					"article.ts": {
						"desc": "Article storage schema with optional document_id, title, path, content, source classifier(for: linkcase|wiki|memory|user), scope ownership(scope_type: global|project|agent + scope_id), data origin(source: agent|superego), metadata, and sop flag",
						"role": "Schema"
					},
					"document.ts": {
						"desc": "Document storage schema with title, optional description/path, triple generation state, and timestamps",
						"role": "Schema"
					},
					"session.ts": {
						"desc": "Chat session storage schema with nullable key, optional im/cron flags, and related indexes",
						"role": "Schema"
					},
					"project.ts": {
						"desc": "Project storage schema with name, description, directory, order, model metadata, and timestamps",
						"role": "Schema"
					},
					"message.ts": { "desc": "Chat message storage schema with UIMessages", "role": "Schema" }
				},
				"services": {
					"desc": "Database write/read helpers for core entities and relation-backed projections; todo service now supports single-item lookup, generic list query, standalone todo filtering that excludes session_todo and project_todo bindings, standalone count queries for menu aggregation, and the todo RPC layer now reuses those projections to persist cross-status drag reordering by rewriting status plus sequential order. Project todo external service also exposes count queries for menu aggregation without loading full row sets.",
					"role": "Folder"
				}
			},
			"task": {
				"index.ts": { "desc": "Global queue/emitter state and re-exports", "role": "Index" },
				"types.ts": { "desc": "Task args type definitions (TripleTaskArgs, etc.)", "role": "Type" },
				"start.ts": { "desc": "Initialize all task queues and start polling", "role": "Module" },
				"poll.ts": { "desc": "Poll DB for pending tasks with exponential backoff", "role": "Module" },
				"schedulePoll.ts": { "desc": "Schedule next poll with timeout", "role": "Module" },
				"process.ts": {
					"desc": "Process single task: update status, run handler, handle errors",
					"role": "Module"
				},
				"cancelTask.ts": {
					"desc": "Cancel task by setting fail status and removing from queue",
					"role": "Module"
				},
				"pauseTask.ts": { "desc": "Pause a task queue by type", "role": "Module" },
				"resumeTask.ts": { "desc": "Resume a paused task queue by type", "role": "Module" },
				"pauseTriple.ts": {
					"desc": "Pause/resume triple queue with shared concurrency counter",
					"role": "Module"
				},
				"retryTask.ts": { "desc": "Retry a failed task by resetting to pending", "role": "Module" },
				"ignoreTask.ts": { "desc": "Ignore task by setting skipped status", "role": "Module" },
				"removeTask.ts": { "desc": "Remove task from queue and DB", "role": "Module" },
				"handleTriple": { "desc": "Triple extraction and graph insertion logic", "role": "Folder" },
				"handleError": { "desc": "Task failure error handlers by type", "role": "Folder" }
			},
			"io": {
				"save": { "desc": "Article and Document saving logic", "role": "Folder" },
				"search": {
					"desc": "Search pipeline with keyword/vector recall, semantic filtering, light boost correction, and rerank/time-weighted article scoring, with inspect as the single implementation entry for deterministic functional testing",
					"role": "Folder"
				},
				"forget.ts": { "desc": "Memory forgetting logic", "role": "Module" },
				"recall.ts": { "desc": "Memory recall logic", "role": "Module" },
				"update.ts": { "desc": "Memory update logic", "role": "Module" }
			},
			"pipeline": {
				"getChunks": { "desc": "Semantic and split chunking logic", "role": "Folder" },
				"getEmbedding.ts": { "desc": "Text embedding generation", "role": "Module" },
				"getKeywords.ts": { "desc": "Keyword extraction logic", "role": "Module" },
				"getRewriteQuery.ts": { "desc": "Gen Model query expansion for search", "role": "Module" },
				"index.ts": { "desc": "Pipeline module exports", "role": "Index" }
			},
			"consts": {
				"app.ts": { "desc": "Application constants", "role": "Constant" },
				"db.ts": {
					"desc": "Centralized todo priority/status zod schemas, status list, and shared todo status ordering helper",
					"role": "Constant"
				},
				"mem.ts": { "desc": "Memory system constants", "role": "Constant" },
				"pipeline.ts": { "desc": "Pipeline constants", "role": "Constant" },
				"search.ts": {
					"desc": "Centralized search thresholds, weights, and sqlite-vec limits",
					"role": "Constant"
				},
				"prompts": {
					"desc": "Centralized prompt builders for FST agents, tools, and system. All getXPrompt functions are pure functions receiving preprocessed plain data (no Session dependency).",
					"role": "Folder",
					"getAuditPrompt.ts": "Core audit/permission evaluation prompt template (tool, action, path, context)",
					"getChaosPrompt.ts": "Chaos detection prompt from recent assistant outputs",
					"getContextPrompt.ts": "Context state management system prompt with usage rules",
					"getSkillPrompt.ts": "Available Skills system prompt summary from SkillMeta array",
					"getCustomToolsPrompt.ts": "Available Custom Tools system prompt summary from CustomToolMeta array",
					"getTrimPrompt.ts": "Context-preserving trim analysis prompt from trimmed/remaining messages",
					"getTitlePrompt.ts": "Session title generation prompt from recent messages and focus",
					"getPermissionPrompt.ts": "Permission evaluation prompt wrapper around getAuditPrompt",
					"getAuditSessionPrompt.ts": "Cron content audit prompt wrapper around getAuditPrompt",
					"getCommandAuditPrompt.ts": "Command security review prompt from SystemCommandSpec",
					"getSystemToolsPrompt.ts": "System capabilities prompt from SystemSpec"
				}
			},
			"utils": {
				"trpc.ts": { "desc": "tRPC initialization and procedure/router exports", "role": "Utility" },
				"arrayMove.ts": {
					"desc": "Generic array reorder utility returning a moved-copy list",
					"role": "Utility"
				},
				"ensureArray.ts": {
					"desc": "Generic unknown-to-array normalization helper",
					"role": "Utility"
				},
				"getModel.ts": { "desc": "Model path retrieval utility", "role": "Utility" },
				"getSystemTools.ts": {
					"desc": "Runtime OS and CLI capability prompt generator backed by in-memory command metadata",
					"role": "Utility"
				},
				"system": {
					"desc": "System command inventory, risk rule generation, and prompt formatting helpers",
					"role": "Folder"
				},
				"loadModel.ts": { "desc": "Model loading utility", "role": "Utility" },
				"clearPlan.ts": {
					"desc": "Clear session plan file on message clear or archive",
					"role": "Utility"
				},
				"index.ts": { "desc": "Utils exports", "role": "Index" }
			},
			"index.ts": { "desc": "Main package exports (API, RPCs, types)", "role": "Index" },
			"auth.ts": { "desc": "Authentication configuration", "role": "Module" },
			"config.ts": { "desc": "Real-time config mapping with watchpack", "role": "Module" },
			"env.ts": { "desc": "Environment variable configuration", "role": "Module" }
		},
		"test": {
			"memory.spec.ts": { "desc": "Save/update/forget and confidence tests", "role": "Test" },
			"query.spec.ts": { "desc": "Query, rerank, threshold, COT, and recall tests", "role": "Test" }
		}
	}
}
```

## 3. Operational Guidelines

- **Polywise.off()**: Now an `async` method. ALWAYS `await poly.off()` when closing the database connection.
- **Database**: Uses better-sqlite3 with sqlite-vec
- **Migration**: Database schema changes require migration updates (see global.md rules)
- **Unique String IDs**: ALL IDs (node_id, article_id, edge_id, memory_id) are TEXT strings generated by uuid v7, NOT auto-incrementing integers
