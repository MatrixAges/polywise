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
			"Activation.ts": {
				"desc": "Neural activation manager implementing Spreading Activation logic. Handles node stimulation and iterative activation spreading via Polywise.tick().",
				"role": "Class"
			},
			"Article.ts": { "desc": "Article manager class for CRUD and search operations", "role": "Class" },
			"Brain.ts": { "desc": "Brain lifecycle manager with fatigue state machine", "role": "Class" },
			"Cortex.ts": {
				"desc": "Query processing with single/iterative search modes, quality filtering, and result aggregation",
				"role": "Class"
			},
			"Log.ts": {
				"desc": "Logging module for query and save operations with .log and .json output",
				"role": "Class"
			},
			"Pipeline.ts": {
				"desc": "Pipeline manager with embedding, reranking, and keyword generation (ReBel) capabilities. Rerank output is normalized with label-aware score parsing (LABEL_1/relevant) for stable relevance scores. Keyword generation is exposed via generateKeywords() and always returns an array.",
				"role": "Class"
			},
			"Polywise.ts": {
				"desc": "Core database API for memory graph operations. Includes public instances of Brain, Article, and Pipeline. Supports hybrid retrieval with memory recall, external search, result aggregation, and reranking. Provides save() and update() with batch keyword extraction + injectKeywords() graph injection, and forget() to remove memory with node/edge downweighting.",
				"role": "Class"
			},
			"Process.ts": {
				"desc": "Process tracking class for monitoring query execution with event emission and state accumulation",
				"role": "Class"
			},
			"consts": {
				"database.ts": { "desc": "Database configuration constants", "role": "Constant" },
				"format.ts": { "desc": "String formatting utilities", "role": "Constant" },
				"index.ts": { "desc": "Main constants export", "role": "Index" },
				"model.ts": { "desc": "Model-related constants", "role": "Constant" },
				"performance.ts": { "desc": "Performance and threshold constants", "role": "Constant" },
				"schema.ts": {
					"desc": "Database schema constants (SCHEMA_MEMORY='memory')",
					"role": "Constant"
				}
			},
			"index.ts": { "desc": "Main exports", "role": "Index" },
			"sql": {
				"Brain.ts": { "desc": "Brain SQL operations", "role": "SQL" },
				"Polywise.ts": {
					"desc": "Polywise SQL operations (Articles/Nodes/Edges) including memory propagation, decay logic, stats tracking, and transaction-safe keyword injection helpers",
					"role": "SQL"
				},
				"index.ts": { "desc": "SQL exports", "role": "Index" },
				"meta.ts": { "desc": "Metadata SQL operations", "role": "SQL" },
				"schema.ts": {
					"desc": "Database schema definitions (memory schema: Nodes/Edges/Articles with JSONB metadata for Articles only and CASCADE)",
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
					"desc": "Core types (Node, Edge, Snapshot, BrainState, Migration, etc.)",
					"role": "Type"
				}
			},
			"utils": {
				"calculateFatigue.ts": { "desc": "Fatigue calculation utility", "role": "Utility" },
				"calculateWeight.ts": { "desc": "Weight calculation utility", "role": "Utility" },
				"generateHash.ts": { "desc": "SHA-256 file hashing utility", "role": "Utility" },
				"generateId.ts": { "desc": "Unique string ID generator using uuid v7", "role": "Utility" },
				"generateModelHash.ts": {
					"desc": "Model hash generation utility for .onnx files",
					"role": "Utility"
				},
				"generateNodePosition.ts": { "desc": "Random node position generator", "role": "Utility" },
				"index.ts": { "desc": "Utils exports", "role": "Index" },
				"isIdle.ts": { "desc": "Idle state checker", "role": "Utility" },
				"listRecursive.ts": { "desc": "Recursive directory listing utility", "role": "Utility" },
				"processText.ts": {
					"desc": "Text processing utility for large text slicing",
					"role": "Utility"
				},
				"verifyModel.ts": {
					"desc": "Model integrity verification utility for .onnx files",
					"role": "Utility"
				},
				"ranking.ts": { "desc": "Ranking utility", "role": "Utility" },
				"mmr.ts": {
					"desc": "Maximum Marginal Relevance algorithm for semantic retrieval diversification",
					"role": "Utility"
				},
				"migration.ts": {
					"desc": "Database schema migration system with version tracking and validation (CURRENT_SCHEMA_VERSION=1)",
					"role": "Module"
				}
			}
		},
		"test": {
			"migration.spec.ts": { "desc": "Migration tests", "role": "Test" },
			"brain.spec.ts": { "desc": "Knowledge graph dynamics and learning tests", "role": "Test" },

			"article.spec.ts": { "desc": "Article tests", "role": "Test" },
			"cot.spec.ts": { "desc": "Chain of thought tests", "role": "Test" },
			"learning.spec.ts": { "desc": "Pure text learning and large scale dataset tests", "role": "Test" },
			"models.spec.ts": { "desc": "Model hash verification and integrity tests", "role": "Test" },
			"longembedding.spec.ts": {
				"desc": "Long text embedding and fact preservation tests",
				"role": "Test"
			},
			"log.spec.ts": { "desc": "Log module tests", "role": "Test" },
			"utils": {
				"getCache.ts": {
					"desc": "Test cache helper for embeddings/rerank/keywords with mock keyword cache normalization",
					"role": "Utility"
				}
			},
			"datasets": {
				"behavioral.ts": { "desc": "Behavioral prompts and benchmarks", "role": "Data" },
				"cognitive.ts": { "desc": "Cognitive and reasoning datasets", "role": "Data" },

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
			"beforeTest.ts": {
				"desc": "Pre-test setup with precise cache pre-warming for embeddings and keyword cache files via test cache helpers",
				"role": "Script"
			},
			"afterTest.ts": { "desc": "Post-test cleanup", "role": "Script" },
			"fetch_datasets.ts": {
				"desc": "Script to fetch and clean complex datasets from external sources",
				"role": "Script"
			}
		},
		".test_vectors": {
			"desc": "Persistent cache for model embeddings and reranking results",
			"role": "Data"
		},
		"package.json": { "desc": "Polywise package configuration", "role": "Config" },
		"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
		"rstest.config.ts": { "desc": "RSTest configuration", "role": "Config" },
		"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
	}
}
```

## 3. Operational Guidelines

- **Polywise.off()**: Now an `async` method. ALWAYS `await poly.off()` when closing the database connection.
- **TDD**: Follow TDD principles for new features (see global.md rules)
- **Database**: Uses PGlite for embedded PostgreSQL
- **Migration**: Database schema changes require migration updates (see global.md rules)
- **Keyword Generation**: The `save()` and `update()` methods automatically extract keywords from content using the ReBel model (DEFAULT_REBEL_MODEL) and inject them as linked nodes into the knowledge graph.
- **Pipeline**: Handles embedding, reranking, and keyword extraction with configurable concurrency for each operation.
- **断点下载**: Uses native fetch with Range header for resuming downloads
- **Unique String IDs**: ALL IDs (node_id, article_id, edge_id, memory_id) are TEXT strings generated by uuid v7, NOT auto-incrementing integers
