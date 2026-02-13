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
			"Fst.ts": { "desc": "Main orchestrator for the autonomous agent loop.", "role": "Core" },
			"Providers.ts": {
				"desc": "Multi-provider management with intelligent routing, cost control, and fallback.",
				"role": "Core"
			},
			"Sessions.ts": {
				"desc": "Session management using mingo for structured finite context state machine.",
				"role": "Core"
			},
			"Fs.ts": { "desc": "File-based information exchange and persistence layer.", "role": "Core" },
			"Tools.ts": { "desc": "Bridge between pi-coding-agent tools and Vercel AI SDK.", "role": "Core" },
			"index.ts": { "desc": "Package entry point.", "role": "Index" }
		},
		"scripts": {
			"desc": "Maintenance and utility scripts"
		},
		"test": {
			"desc": "Functional and integration tests"
		},
		"package.json": { "desc": "Package configuration", "role": "Config" },
		"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
		"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" },
		"agentmap.md": { "desc": "Module overview and architecture", "role": "Docs" },
		"README.md": { "desc": "Project documentation (English)", "role": "Docs" },
		"README.zh.md": { "desc": "Project documentation (Chinese)", "role": "Docs" }
	}
}
```

## 3. Operational Guidelines

- **单次会话原则**: 配合 Polywise 确保信息准确有效，不产生无限叠加的上下文。
- **结构化输出**: 强制模型通过 Mingo 友好的结构化格式输出以管理状态。
- **成本控制**: 必须在路由层级校验 Token 使用量与成本配额。
- **TDD**: Follow TDD principles for new features
