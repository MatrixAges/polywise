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
			"schema": {
				"article.ts": { "desc": "Drizzle schema for articles table", "role": "Schema" },
				"chunk.ts": { "desc": "Drizzle schema for chunks table with vector support", "role": "Schema" },
				"index.ts": { "desc": "Schema exports", "role": "Index" }
			},
			"Activation.ts": {
				"desc": "Neural activation manager implementing Spreading Activation logic. Handles node stimulation and iterative activation spreading via Polywise.tick() with support for learning phases and dynamic arousal modulation.",
				"role": "Class"
			},
			"Article.ts": { "desc": "Article manager class for CRUD and search operations", "role": "Class" },
			"Brain.ts": {
				"desc": "Brain lifecycle manager with fatigue state machine and sleep/shadow tick consolidation",
				"role": "Class"
			},
			"Cortex.ts": {
				"desc": "Query processing with single/iterative search modes, quality filtering, and result aggregation",
				"role": "Class"
			},
			"decorators": {
				"catchError.ts": { "desc": "Error-handling decorator", "role": "Decorator" },
				"catchFinally.ts": { "desc": "Finally-hook decorator", "role": "Decorator" },
				"index.ts": { "desc": "Decorators export", "role": "Index" }
			},
			"Console.ts": {
				"desc": "Structured, colorized logging utility with stage-based filtering and environment detection. Provides beautiful, readable output for development.",
				"role": "Class"
			},
			"Log.ts": {
				"desc": "Logging module for query and save operations with .log and .json output",
				"role": "Class"
			},
			"Pipeline.ts": {
				"desc": "Pipeline manager with embedding, reranking, and KeyBERT-based keyword extraction capabilities. Rerank output is normalized with label-aware score parsing (LABEL_1/relevant) for stable relevance scores. Keyword generation is exposed via generateKeywords() and leverages the existing embedding model. Now supports inference batching for memory stability.",
				"role": "Class"
			},
			"Polywise.ts": {
				"desc": "Core database API for memory graph operations with snapshot seeding fallback, multi-step temporal context prediction with replay weighting, and conflict-aware signals. Includes public instances of Brain, Article, and Pipeline. Supports dual-process memory with separate working memory recall and LTM consolidation. Dynamic attention plasticity modifies learning rates based on arousal during saves, with global inhibition applied during tick propagation.",
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
				"performance.ts": {
					"desc": "Performance, inhibition, threshold, conflict, and temporal sequencing constants",
					"role": "Constant"
				},
				"schema.ts": {
					"desc": "Database schema constants (SCHEMA_MEMORY='memory')",
					"role": "Constant"
				}
			},
			"index.ts": { "desc": "Main exports", "role": "Index" },
			"sql": {
				"Brain.ts": {
					"desc": "Brain SQL operations including context-weighted sleep replay",
					"role": "SQL"
				},
				"Polywise.ts": {
					"desc": "Polywise SQL operations (Articles/Nodes/Edges) including memory propagation with global inhibition, decay logic, stats tracking, context sequencing queries, and transaction-safe keyword injection helpers",
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
				"calculateRecencyWeight.ts": { "desc": "Recency weighting utility", "role": "Utility" },
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
				"splitSentence.ts": {
					"desc": "Sentence splitting utility using sentence-splitter for robust multilingual segmentation.",
					"role": "Utility"
				},
				"verifyModel.ts": {
					"desc": "Model integrity verification utility for .onnx files",
					"role": "Utility"
				},
				"KeyBERT.ts": {
					"desc": "Biological-inspired keyword extraction using @node-rs/jieba for POS-tagged segmentation, stopword filtering, and a POS boundary firewall (filtering out verbs, adverbs, etc.) for high-quality semantic node candidates.",
					"role": "Utility"
				},
				"aggregation.ts": {
					"desc": "Memory aggregation logic for recall + external results with sequence context weighting",
					"role": "Utility"
				},
				"ranking.ts": {
					"desc": "Ranking utility with rerank skipping and conflict-aware stimulation gating",
					"role": "Utility"
				},
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
			"memory.spec.ts": { "desc": "Save/update/forget and confidence tests", "role": "Test" },
			"query.spec.ts": { "desc": "Query, rerank, threshold, COT, and recall tests", "role": "Test" },
			"graph.spec.ts": { "desc": "Snapshot and related node retrieval tests", "role": "Test" },
			"context.spec.ts": { "desc": "Context filter and temporal update tests", "role": "Test" },
			"long.spec.ts": { "desc": "Long context and long text retrieval tests", "role": "Test" },
			"log.spec.ts": { "desc": "Log file generation tests", "role": "Test" },
			"utils": {
				"getCache.ts": {
					"desc": "Test cache helper for embeddings/rerank/keywords with mock keyword cache normalization",
					"role": "Utility"
				},
				"getDataDir.ts": {
					"desc": "Unique test database directory helper",
					"role": "Utility"
				},
				"setup.ts": {
					"desc": "Shared test setup helpers",
					"role": "Utility"
				},
				"withPolywise.ts": {
					"desc": "Polywise lifecycle helper for tests",
					"role": "Utility"
				}
			},
			"datasets": {
				"behavioral.ts": { "desc": "Behavioral prompts and benchmarks", "role": "Data" },
				"cognitive.ts": { "desc": "Cognitive and reasoning datasets", "role": "Data" },
				"paradigms.ts": { "desc": "Spacing, DRM, and interference datasets", "role": "Data" },

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
			},
			"testKeywords.ts": { "desc": "Keyword extraction smoke test", "role": "Script" },
			"testTriple.ts": { "desc": "Keyword extraction batch test", "role": "Script" }
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
- **Keyword Generation**: The `save()` and `update()` methods automatically extract keywords from content using the KeyBERT algorithm (leveraging existing embedding models) and inject them as linked nodes into the knowledge graph.
- **Activation & Decay**: Implements biological Integrate-and-Fire mechanics with digital `is_active` state, refractory periods, and hyperpolarization. Weight decay is threshold-triggered based on input cumulative activity, preventing time-based loss of shared knowledge. Locked nodes/edges are preserved during decay.
- **Pipeline**: Handles embedding, reranking (with inference batching), and keyword extraction.
- **断点下载**: Uses native fetch with Range header for resuming downloads
- **Unique String IDs**: ALL IDs (node_id, article_id, edge_id, memory_id) are TEXT strings generated by uuid v7, NOT auto-incrementing integers

## Full Self Thinking (FST) 智能体的核心实现，负责模型调度、会话持久化及结构化上下文管理。

### 关键技术栈

- **pi-mono**: 系统级交互底层
- **Vercel AI SDK v6**: 多模型 Provider 调度与滑动窗口会话管理 (streamText)
- **Shadow Context**: 基于 JSON 的持久化状态机，包含任务、引用及摘要
- **File-based Persistence**: 扁平化消息存储与分片列表，支持大规模对话历史的高效检索

### 核心特性

- **滑动窗口**: 仅加载最近 6 条消息，减少 Token 消耗
- **Shadow Context**: AI 自主维护的全局状态，对用户不可见
- **碎片化存储**: 每条消息独立存储，便于 tools (grep/find) 检索详情
- **分片机制**: 消息列表每 100 条分片存储，优化 I/O
