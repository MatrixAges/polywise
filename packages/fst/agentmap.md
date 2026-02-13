# Agent Map

This document provides an overview of the packages/fst module structure and architecture.

## 1. 核心架构

该 package 作为 Full Self Thinking (FST) 智能体的核心实现，负责模型调度、会话持久化及结构化上下文管理。

### 关键技术栈

- **pi-mono**: 系统级交互底层
- **Vercel AI SDK**: 多模型 Provider 调度与会话管理
- **Mingo**: 结构化数据查询与有限上下文状态机
- **Polywise**: 集成强化学习记忆引擎

### 核心特性

- **文件化持久化**: 无需数据库，每个对话拥有独立文件夹
- **有限上下文管理**: 基于状态机的结构化上下文，支持 undo/redo
- **智能分流路由**: 支持前置路由模型与成本上限控制
- **失败回退机制**: 自动切换备选模型确保工作流持续

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/fst",
	"structure": {
		"src": {
			"Fst.ts": {
				"desc": "Main orchestrator using await-to-js and Polywise memory partitioned by conversation_id.",
				"role": "Core"
			},
			"Providers.ts": {
				"desc": "Provider management with global config.jsonc (env-paths), Zod validation and OpenAI compatible routing.",
				"role": "Core"
			},
			"Sessions.ts": {
				"desc": "Session state management using await-to-js and mingo.",
				"role": "Core"
			},
			"Fs.ts": { "desc": "File system abstraction layer using fs-extra and await-to-js.", "role": "Core" },
			"Tools.ts": { "desc": "Bridge between pi-coding-agent tools and Vercel AI SDK.", "role": "Core" },
			"types": {
				"desc": "Modularized type definitions and Zod schemas.",
				"role": "Types"
			},
			"index.ts": { "desc": "Package entry point.", "role": "Index" }
		},
		"scripts": {
			"desc": "Maintenance and utility scripts"
		},
		"test": {
			"desc": "Functional and integration tests"
		},
		"package.json": { "desc": "Package configuration with fs-extra and await-to-js", "role": "Config" },
		"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
		"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" },
		"agentmap.md": { "desc": "Module overview and architecture", "role": "Docs" },
		"README.md": { "desc": "Project documentation (English)", "role": "Docs" },
		"README.zh.md": { "desc": "Project documentation (Chinese)", "role": "Docs" }
	}
}
```

## 3. Operational Guidelines

- **Error Handling**: 强制使用 `await-to-js` (`to()`) 替代传统的 `try-catch` 块。
- **文件 I/O**: 统一使用 `fs-extra` 提供的增强型 API。
- **配置隔离**: 默认配置文件存储在用户配置目录的 `polywise/config.jsonc` 中。
- **内存分区**: 通过 `metrics_ids: [conversation_id]` 对 Polywise 记忆进行逻辑分区。
- **DI 驱动**: 所有核心组件均标记为 `@injectable()`。
- **视觉风格**: 同步与异步语句之间、不同逻辑段落之间需保持空行分隔。
- **零注释**: 优先通过语义化命名表达逻辑。
