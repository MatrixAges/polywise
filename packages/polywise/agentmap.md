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
					"desc": "Session lifecycle and stream orchestration for chat and cron-triggered runs, consuming skill_map loading from fst/tools/skill and title_tool-based session renaming; supports archive/unarchive flow with archived_at state persisted in session_dir/state.json and message queries scoped by archived boundary",
					"role": "Folder"
				},
				"agents": {
					"desc": "Internal decision agents for permission, audit, system operations, and AI-generated session titles",
					"role": "Folder"
				},
				"tools": {
					"desc": "Bash sandboxing tools via bash-tool and local skill search/read/rebuild tooling backed by persisted skill_map.json under skills_dir",
					"role": "Folder",
					"cron.ts": "Create/list/read/update/remove cron jobs backed by app.app_path/cron.json with incremental runtime reload and physical directory removal",
					"title.ts": "Internal tool that generates and updates session titles while protecting manually edited titles",
					"webfetch.ts": "Fetch URL content as Markdown (Jina primary, fetch+turndown fallback)",
					"websearch.ts": "Web search via DuckDuckGo HTML → turndown Markdown"
				},
				"cron": {
					"desc": "Cron metadata store/runtime/logging backed by cron.json and Croner jobs, including session execution bridge",
					"role": "Folder"
				},
				"mcp": { "desc": "MCP client tools integration", "role": "Folder" },
				"acp": { "desc": "ACP provider integration", "role": "Folder" }
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
				"initSql.ts": { "desc": "Virtual table initialization", "role": "Module" },
				"migrate.ts": { "desc": "Migration runner", "role": "Module" },
				"schema": {
					"article.ts": {
						"desc": "Article storage schema with content, source classifier(for: linkcase|wiki|memory|user), metadata, and sop flag",
						"role": "Schema"
					},
					"session.ts": {
						"desc": "Chat session storage schema with nullable key, optional im/cron flags, and related indexes",
						"role": "Schema"
					},
					"message.ts": { "desc": "Chat message storage schema with UIMessages", "role": "Schema" }
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
				"search": { "desc": "Search pipeline with keywords/vector/rrf/rerank", "role": "Folder" },
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
				"mem.ts": { "desc": "Memory system constants", "role": "Constant" },
				"pipeline.ts": { "desc": "Pipeline constants", "role": "Constant" }
			},
			"utils": {
				"trpc.ts": { "desc": "tRPC initialization and procedure/router exports", "role": "Utility" },
				"getModel.ts": { "desc": "Model path retrieval utility", "role": "Utility" },
				"getSystemTools.ts": {
					"desc": "Runtime OS and CLI capability prompt generator",
					"role": "Utility"
				},
				"loadModel.ts": { "desc": "Model loading utility", "role": "Utility" },
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
- **TDD**: Follow TDD principles for new features (see global.md rules)
- **Database**: Uses better-sqlite3 with sqlite-vec
- **Migration**: Database schema changes require migration updates (see global.md rules)
- **Unique String IDs**: ALL IDs (node_id, article_id, edge_id, memory_id) are TEXT strings generated by uuid v7, NOT auto-incrementing integers
