<p align="right">中文 | <a href="README.md">English</a></p>

<p align="center">
  <img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Polywise</p>

<p align="center"><strong>智能体记忆引擎</strong></p>

<p align="center">
  <a href="https://github.com/MatrixAges/polywise/stargazers"><img src="https://img.shields.io/github/stars/MatrixAges/polywise?style=rounded&color=795548" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <a href="https://x.com/xiewendao"><img src="https://img.shields.io/badge/FollowX-XWD-green?logo=Twitter" alt="Twitter"></a>
</p>

## 💡 为什么需要 Polywise？

目前的 AI 架构缺少一个关键组件：**类似海马体的记忆系统**。虽然 LLM 在模式匹配和文本生成方面表现出色，但它们缺乏真正的、不断进化的记忆。每次交互往往是孤立的，这意味着知识无法演化——它们只是被存储，而不是被理解。

Polywise 通过实现一个**受神经科学启发的记忆引擎**改变了这一点，它作为现代 AI "数字海马体"：

- 🎭 **情景与语义记忆**：记住特定的交互，并理解概念之间的相互关系。
- 🔗 **联想图谱**：知识以相互连接的概念形式存储，而非孤立的片段。
- ⚡ **激活扩散**：思维通过有机流动自然地触发相关联想，通过连接而非仅靠向量相似性实现联想回忆。
- 🌙 **记忆巩固**：模仿人类睡眠，通过结构化的生命周期强化重要记忆并修剪无用噪声。
- 🔄 **迭代搜索**：思维链 (CoT) 模式通过关键词扩展执行多次搜索迭代，实现全面检索。

---

## 🚀 Polywise 如何增强 AI

#### 1. 🧠 **AI 智能体的长期记忆**

Polywise 允许 AI 智能体通过每一次对话学习并成长，将情景交互转化为结构化的语义知识。

```typescript
const poly = new Polywise()
await poly.init({
	data_dir: './my-memory',
	idol_id: 'user_123',
	root_ids: ['global_knowledge']
})

// 可以随时更新筛选器
poly.setFilters({ idol_id: 'user_456' })

// 保存情景记忆（文本内容）
// 默认使用类成员变量中的 idol_id 和 root_ids 进行标记
await poly.save({
	content: '用户偏好 TypeScript 并且习惯在深夜工作。'
})

// 检索相关信息，支持上下文感知搜索
const { memory, metadata } = await poly.query({
	query: '用户的偏好是什么？'
})
```

#### 2. ⚡ **统一混合检索**

Polywise 实现了统一的检索系统，结合基于图的记忆召回与向量和全文搜索。

```typescript
// 单次搜索（快速）
const { memory, metadata } = await poly.query({
	query: '用户的偏好是什么？',
	cot_depth: 1
})

// 迭代搜索（全面）
const { memory, metadata } = await poly.query({
	query: '微服务架构模式',
	cot_depth: 3, // 迭代次数
	recall_depth: 2, // 图遍历深度
	search_limit: 20, // 每次迭代最大结果数
	rerank_limit: 10 // 最终结果数
})

// memory[0] -> "..." (字符串)
// metadata       -> { links: ["..."], files: ["..."], desc: "..." }
```

#### 3. 🔭 **思维链（迭代搜索）**

对于复杂查询，Polywise 可以迭代探索知识网络，通过发现的关键词扩展查询。

```typescript
// 通过 cot_depth 开启思维链 (CoT) 探索
const { memory, metadata, cot } = await poly.query({
	query: '如何优化内存使用？',
	cot_depth: 3, // 执行 3 次搜索迭代
	search_limit: 5, // 每次迭代的结果数
	rerank_limit: 10 // 重排序后的最终结果数
})

// 订阅迭代进度
cot.on(event => {
	console.log(`发现 ${event.memory.length} 条见解`)
	console.log(`最相关描述: ${event.metadata.desc}`)
})
```

**迭代搜索工作原理：**

1. 使用当前查询进行搜索
2. 按质量阈值过滤结果（重排序分数 >= 0.4）
3. 收集独特的高质量结果
4. 提取关键词并扩展查询
5. 重复直到达到迭代限制或收敛

**质量控制：**

- 阶段 1：按 `combinedScore >= 0.4` 过滤
- 阶段 2：最终按 `combinedScore >= 0.5` 过滤
- 跨迭代按内容 ID 去重

---

## 🏗️ 架构

```bash
          用户输入 (Input)
                ↓
┌──────────────────────────────────────────────┐
│  阶段 0: Cortex 执行门控                      │
│  - 检查 cot_depth 参数                       │
│  - 初始化 ChainEmitter                       │
└──────────────────────────────────────────────┘
      ↓                      ↘
[cot_depth <= 1]          [cot_depth > 1]
   (单次搜索)               (迭代搜索)
      ↓                      ↘
      ↓                   ┌──────────────────────────────────────────┐
      ↓                   │ 阶段 0.5: 迭代搜索循环                    │
      ↓                   │ - 使用当前查询执行搜索                    │
      ↓                   │ - 按质量阈值过滤结果                      │
      ↓                   │ - 收集独特结果                            │
      ↓                   │ - 使用关键词扩展查询                      │
      ↓                   │ - 重复直到深度耗尽                        │
      └───────────────────┴──────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ 阶段 1: 混合检索 - executeSingleSearch                                   │
│ - 图谱回忆: recallFromMemory (关键词 -> 节点 -> 激活扩散)                │
│ - 外部搜索: 向量与全文搜索 (使用 Pipeline 进行嵌入)                      │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ 阶段 2: 结果聚合与质量过滤                                               │
│ - aggregateResults: 合并召回和搜索结果                                    │
│ - 按 ID 去重                                                              │
│ - 过滤: combinedScore >= 阈值                                             │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ 阶段 3: 重排序 (Reranking)                                               │
│ - Pipeline.rerank: 对知识候选进行语义评分                                 │
│ - 结果截断 (基于 rerank_limit)                                            │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
     响应 ───→ [ 写入日志: Log.write ]
                             ↓
                  ┌──────────────────────────────────┐
                  │ 阶段 4: 大脑生命周期             │
                  │ - Brain.ts: 管理状态             │
                  │ - 空闲检测 -> 触发睡眠           │
                  │   - SQL: 衰减 / 修剪 / 重放      │
                  └──────────────────────────────────┘
```

## 📚 核心概念

### 🔗 节点与边

- **节点**：一个概念、实体或知识点
- **边**：概念之间的语义关系
- **权重**：连接强度（0.1 - 5.0）
- **激活**：节点的当前能量水平

### 🧠 学习机制

1. 💪 **赫布学习**：连接的活跃节点增强它们的纽带
2. 📉 **衰减**：未使用的连接随时间减弱
3. 🌙 **巩固**：睡眠阶段强化重要记忆
4. ⚡ **刺激**：外部输入激活节点并传播

### 🔄 状态机

Brain 在以下状态中运行：

- 🌱 **FRESH**：准备学习
- 🧠 **LEARNING**：处理新信息
- 😴 **TIRED**：需要巩固
- 🌙 **SLEEPING**：记忆巩固进行中

---

## 🛠️ 开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 运行核心测试

验证核心记忆引擎：

```bash
pnpm --filter polywise test
```

### 3. 调试

Polywise 作为一个 Electron 应用程序运行。你需要同时启动前端和桌面进程：

```bash
# 在一个终端中，启动 React 前端
pnpm --filter app dev

# 在另一个终端中，启动 Electron 外壳
pnpm --filter desktop dev
```

### 4. 构建

为你的平台打包应用程序：

```bash
# 为 macOS 构建
pnpm build:mac

# 为 Windows 构建
pnpm build:win
```

---

## 💭 理念

Polywise 的构建基于这样的信念：**真正智能的 AI 需要真正智能的记忆**。不仅仅是存储，而是一个能够有机地形成连接、随使用而增强、战略性地遗忘并持续演化的系统。

---

## 📄 参考文献

本项目受以下研究论文启发：

- [Long-lasting potentiation of synaptic transmission (1973)](<.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 鸣谢

Polywise 站在这些优秀开源项目的肩膀上：

### 库与工具

- 🐘 **[PGlite](https://github.com/electric-sql/pglite)** - 为本地优先应用打造的 Wasm 版 PostgreSQL
- ⚛️ **[React](https://react.dev/)** - 前端 UI 库
- 🖥️ **[Electron](https://www.electronjs.org/)** - 桌面应用框架
- 🔗 **[tRPC](https://trpc.io/)** - 端到端类型安全 API
- 📦 **[MobX](https://mobx.js.org/)** - 简单、可扩展的状态管理
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - 原子类 CSS 框架
- 🚀 **[Hono](https://hono.dev/)** - 极速 Web 框架
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - 基于 Rspack 的次世代构建工具
- 📚 **[Rslib](https://rslib.dev/)** - 由 Rsbuild 驱动的库构建工具
- 🤗 **[Transformers.js](https://huggingface.co/docs/transformers.js/)** - 浏览器端的先进机器学习库
- ⚡ **[ONNX Runtime](https://onnxruntime.ai/)** - 高性能机器学习推理引擎

### 模型

- 🤖 **[Qwen3-Embedding](https://huggingface.co/onnx-community/Qwen3-Embedding-0.6B-ONNX)** - **向量编码**：将文本转化为高维向量，用于语义搜索和图谱召回。
- 🎯 **[BGE Reranker v2-m3](https://huggingface.co/onnx-community/bge-reranker-v2-m3-ONNX)** - **精准排序**：对检索到的知识进行重排序，确保最相关的内容优先呈现。

## 📜 开源协议

MIT - 详情请参见 [LICENSE](LICENSE)。
