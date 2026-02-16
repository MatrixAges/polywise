# Agent Map

This document provides an overview of the packages/fst module structure and architecture.

## 1. 核心架构

该 package 作为 Full Self Thinking (FST) 智能体的核心实现，负责模型调度、会话持久化及结构化上下文管理。

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

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/fst",
	"structure": {
		"src": {
			"Fst.ts": {
				"desc": "Main orchestrator using streamText/generateText and Shadow Context logic.",
				"role": "Core"
			},
			"Provider.ts": {
				"desc": "Provider management with global config.jsonc.",
				"role": "Core"
			},
			"Session.ts": {
				"desc": "Session state management handling Shadow Context and sliding window.",
				"role": "Core"
			},
			"Fs.ts": {
				"desc": "File system layer for flat message storage and chunked lists.",
				"role": "Core"
			},
			"Tools.ts": {
				"desc": "Exploration tools (read, grep, find, ls) and context management (update_context).",
				"role": "Core"
			},
			"types": {
				"shadow.ts": { "desc": "Zod schemas for Shadow Context and task management." },
				"desc": "Modularized type definitions.",
				"role": "Types"
			},
			"index.ts": { "desc": "Package entry point.", "role": "Index" }
		},
		"package.json": { "desc": "Package configuration", "role": "Config" },
		"agentmap.md": { "desc": "Module overview and architecture", "role": "Docs" }
	}
}
```

## 3. Operational Guidelines

- **Error Handling**: 强制使用 `await-to-js` (`to()`) 替代传统的 `try-catch` 块。
- **文件 I/O**: 统一使用 `fs-extra` 提供的增强型 API。
- **状态维护**: AI 必须通过 `update_context` 工具调用来更新 `Shadow Context`。
- **历史检索**: 超出滑动窗口的历史需通过 `grep` 搜索 `messages/` 目录。
- **视觉风格**: 同步与异步语句之间、不同逻辑段落之间需保持空行分隔。
- **零注释**: 优先通过语义化命名表达逻辑。
