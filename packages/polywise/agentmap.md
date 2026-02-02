# Agent Map

This document provides an overview of the packages/polywise module structure and architecture.

## 1. Module Overview

- **Description**: Neuroscience-inspired knowledge graph and memory system
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
			"ModelManager.ts": {
				"desc": "Local model manager with download, verify, delete, and status tracking",
				"role": "Class"
			},
			"Pipeline.ts": {
				"desc": "Local model manager with embedding and reranking pipelines. Supports local models and API endpoints.",
				"role": "Class"
			},
			"Polywise.ts": {
				"desc": "Core database API for knowledge graph operations. Includes public instances of Brain, Article, and Pipeline. Supports hybrid retrieval with memory recall, external search, result aggregation, and reranking.",
				"role": "Class"
			},
			"index.ts": { "desc": "Main exports", "role": "Index" },
			"cli": {
				"index.ts": { "desc": "CLI entry point using commander", "role": "CLI" },
				"utils.ts": { "desc": "CLI utility functions", "role": "Utility" },
				"commands": {
					"models.ts": {
						"desc": "Model management commands (list, download, delete, status, verify)",
						"role": "CLI"
					},
					"search.ts": { "desc": "Search command", "role": "CLI" },
					"article.ts": { "desc": "Article commands (add, get, list, process)", "role": "CLI" },
					"node.ts": { "desc": "Node commands (add, connect, get, list)", "role": "CLI" },
					"config.ts": { "desc": "Configuration commands (show, set, reset)", "role": "CLI" }
				}
			},
			"sql": {
				"Brain.ts": { "desc": "Brain SQL operations", "role": "SQL" },
				"Polywise.ts": { "desc": "Polywise SQL operations", "role": "SQL" },
				"index.ts": { "desc": "SQL exports", "role": "Index" },
				"meta.ts": { "desc": "Metadata SQL operations", "role": "SQL" },
				"schema.ts": {
					"desc": "Database schema definitions (Nodes/Edges now include JSONB metadata)",
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
				"validateMigrations.ts": { "desc": "Migration validation utility", "role": "Utility" },
				"migration.ts": { "desc": "Database schema migration system", "role": "Module" }
			}
		},
		"test": {
			"migration.spec.ts": { "desc": "Migration tests", "role": "Test" },
			"test.spec.ts": { "desc": "Core functionality tests", "role": "Test" },
			"article.spec.ts": { "desc": "Article tests", "role": "Test" },
			"cot.spec.ts": { "desc": "Chain of thought tests", "role": "Test" }
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
- **CLI**: Run with `pnpm polywise cli` or after build `polywise`
- **ModelManager**: Handles local model management with status tracking (available, downloading, incomplete, error)
- **断点下载**: Uses native fetch with Range header for resuming downloads

## 4. CLI Commands

```bash
# Models
polywise models list                           # 列出本地模型
polywise models download <model_id> [--dtype] # 下载模型
polywise models delete <model_id>             # 删除模型
polywise models status <model_id>             # 查看模型状态
polywise models verify <model_id>             # 验证模型完整性

# Search
polywise search <query> [-l, --limit]         # 搜索文章

# Article
polywise article add <title> <content>        # 添加文章
polywise article get <id>                     # 获取文章
polywise article list [-l, --limit]           # 列出文章
polywise article process <id>                 # 处理文章生成嵌入

# Node
polywise node add <label> <x> <y> [-t, --threshold] # 添加节点
polywise node connect <source_id> <target_id> [-w, --weight] # 连接节点
polywise node get <id>                        # 获取节点
polywise node list [-l, --limit]              # 列出节点

# Config
polywise config show                          # 显示配置
polywise config set <key> <value>            # 设置配置
polywise config reset                         # 重置配置

# System
polywise stats                                # 显示统计信息
polywise init                                 # 初始化数据库
polywise reset                                # 重置数据库
```
