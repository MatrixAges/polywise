# Agent Map

This document provides an overview of the packages/polywise module structure and architecture.

## 1. Module Overview

- **Description**: Build with AI, Build for AI - Neuroscience-inspired knowledge graph and memory system
- **Architecture**: PGlite + TypeScript

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/polywise",
	"structure": {
		"src": {
			"Article.ts": { "desc": "Article manager class for CRUD and search operations", "role": "Class" },
			"Brain.ts": { "desc": "Brain lifecycle manager with fatigue state machine", "role": "Class" },
			"Cortex.ts": { "desc": "Task planning and executive function manager (PFC)", "role": "Class" },
			"Log.ts": {
				"desc": "Logging module for query and save operations with .log and .json output",
				"role": "Class"
			},
			"ModelManager.ts": {
				"desc": "Local model manager with download, verify, delete, and status tracking",
				"role": "Class"
			},
			"Pipeline.ts": {
				"desc": "Local model manager with embedding and reranking pipelines. Supports local models and API endpoints.",
				"role": "Class"
			},
			"Polywise.ts": {
				"desc": "Core database API for knowledge graph operations. Includes public instances of Brain, Article, and Pipeline. Supports hybrid retrieval with memory recall, external search, result aggregation, reranking, and the React (fast decision) system.",
				"role": "Class"
			},
			"Process.ts": {
				"desc": "Process tracking class for monitoring query execution with event emission and state accumulation",
				"role": "Class"
			},
			"consts": {
				"command.ts": { "desc": "Command string constants", "role": "Constant" },
				"format.ts": { "desc": "String formatting utilities", "role": "Constant" },
				"index.ts": { "desc": "Main constants export", "role": "Index" },
				"model.ts": { "desc": "Model-related constants", "role": "Constant" },
				"performance.ts": { "desc": "Performance and threshold constants", "role": "Constant" },
				"schema.ts": { "desc": "Database schema constants", "role": "Constant" }
			},
			"index.ts": { "desc": "Main exports", "role": "Index" },
			"sql": {
				"Brain.ts": { "desc": "Brain SQL operations", "role": "SQL" },
				"Memory.ts": { "desc": "Memory SQL operations", "role": "SQL" },
				"Polywise.ts": { "desc": "Polywise SQL operations (Articles/Nodes/Edges)", "role": "SQL" },
				"index.ts": { "desc": "SQL exports", "role": "Index" },
				"meta.ts": { "desc": "Metadata SQL operations", "role": "SQL" },
				"schema.ts": {
					"desc": "Database schema definitions (Nodes/Edges/Articles include JSONB metadata)",
					"role": "Schema"
				}
			},
			"types": {
				"args.ts": { "desc": "Parameter types for functions and constructors", "role": "Type" },
				"index.ts": { "desc": "Types exports", "role": "Index" },
				"model.ts": {
					"desc": "Model types (ModelStatus, LocalModel, ModelDownloadProgress, etc.)",
					"role": "Type"
				},
				"polywise.ts": {
					"desc": "Core types (Node, Edge, Triple, Snapshot, BrainState, Migration, etc.)",
					"role": "Type"
				}
			},
			"utils": {
				"calculateFatigue.ts": { "desc": "Fatigue calculation utility", "role": "Utility" },
				"calculateWeight.ts": { "desc": "Weight calculation utility", "role": "Utility" },
				"generateNodePosition.ts": { "desc": "Random node position generator", "role": "Utility" },
				"index.ts": { "desc": "Utils exports", "role": "Index" },
				"isIdle.ts": { "desc": "Idle state checker", "role": "Utility" },
				"migrate.ts": { "desc": "Migration execution utility", "role": "Utility" },
				"processText.ts": {
					"desc": "Text processing utility for large text slicing",
					"role": "Utility"
				},
				"validateMigrations.ts": { "desc": "Migration validation utility", "role": "Utility" },
				"migration.ts": { "desc": "Database schema migration system", "role": "Module" }
			}
		},
		"test": {
			"migration.spec.ts": { "desc": "Migration tests", "role": "Test" },
			"brain.spec.ts": { "desc": "Knowledge graph dynamics and learning tests", "role": "Test" },
			"decision.spec.ts": { "desc": "Cerebellum intelligence and decision logic tests", "role": "Test" },
			"article.spec.ts": { "desc": "Article tests", "role": "Test" },
			"cot.spec.ts": { "desc": "Chain of thought tests", "role": "Test" },
			"learning.spec.ts": { "desc": "Pure text learning and large scale dataset tests", "role": "Test" },
			"longembedding.spec.ts": {
				"desc": "Long text embedding and fact preservation tests",
				"role": "Test"
			},
			"react.spec.ts": { "desc": "React system and habitual behavior tests", "role": "Test" },
			"datasets": {
				"behavioral.ts": { "desc": "Behavioral prompts and benchmarks", "role": "Data" },
				"cognitive.ts": { "desc": "Cognitive and reasoning datasets", "role": "Data" },
				"decision.ts": { "desc": "Decision logic and intelligence prompts", "role": "Data" },
				"longcontext.ts": { "desc": "Long context retrieval datasets", "role": "Data" },
				"longembedding.ts": { "desc": "Large scale embedding datasets", "role": "Data" },
				"software.ts": { "desc": "Software architecture and development datasets", "role": "Data" },
				"traps.ts": { "desc": "Linguistic and logical traps for robustness testing", "role": "Data" },
				"text": {
					"desc": "Large-scale pure text datasets (Neuroscience, Philosophy, Legal, Physics, etc.)",
					"role": "Data"
				}
			}
		},
		"scripts": {
			"beforeTest.ts": { "desc": "Pre-test setup with precise cache pre-warming", "role": "Script" },
			"afterTest.ts": { "desc": "Post-test cleanup", "role": "Script" },
			"fetch_datasets.ts": {
				"desc": "Script to fetch and clean complex datasets from external sources",
				"role": "Script"
			}
		},
		".test_vectors": {
			"desc": "Persistent cache for model embeddings, reranking, and decisions",
			"role": "Data"
		},
		"config": {
			"package.json": { "desc": "Polywise package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"rstest.config.ts": { "desc": "RSTest configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		}
	}
}
```

## 3. Operational Guidelines

- **Polywise.off()**: Now an `async` method. ALWAYS `await poly.off()` when closing the database connection.
- **TDD**: Follow TDD principles for new features (see global.md rules)
- **Database**: Uses PGlite for embedded PostgreSQL
- **Migration**: Database schema changes require migration updates (see global.md rules)
- **ModelManager**: Handles local model management with status tracking (available, downloading, incomplete, error)
- **断点下载**: Uses native fetch with Range header for resuming downloads
