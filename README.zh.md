<p align="center">
  <img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Polywise</p>

_<p align="center"><strong>用于人工智能的智能体记忆引擎</strong></p>_

<p align="center">
  <a href="README.md">English</a> |
  简体中文
</p>

## 💡 为什么需要 Polywise？

目前的 AI 架构缺少一个关键组件：**类似海马体的记忆系统**。虽然 LLM 在模式匹配和文本生成方面表现出色，但它们缺乏真正的、不断进化的记忆。每次交互往往是孤立的，这意味着知识无法演化——它们只是被存储，而不是被理解。

Polywise 通过实现一个**受神经科学启发的记忆引擎**改变了这一点，它作为现代 AI “缺失的拼图”：

- 🎭 **情景与语义记忆**：记住特定的交互，并理解概念之间的相互关系。
- 🔗 **联想图谱**：知识以相互连接的概念形式存储，而非孤立的片段。
- ⚡ **激活扩散**：思维通过有机流动自然地触发相关联想，通过连接而非仅靠向量相似性实现联想回忆。
- 🌙 **记忆巩固**：模仿人类睡眠，通过结构化的生命周期强化重要记忆并修剪无用噪声。
- 🔄 **可执行决策**：模拟大脑的双重加工理论（快速反应/深度思考），提供适应性行为。

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
	content: '用户偏好 TypeScript 并且习惯在深夜 work。'
})

// 单次查询即可同时获取信息、潜在的行为建议以及合并筛选后的元数据
// 查询也会自动应用类级别的筛选条件
const { knowledges, actions, metadata } = await poly.query({
	query: '用户的偏好是什么？'
})
```

#### 2. ⚡ **统一检索（快与慢）**

Polywise 实现了统一检索系统，模拟大脑的双重加工理论，同时返回 **Knowledges**（知识信息）和 **Actions**（行为建议）。

```typescript
// 单次查询即可同时获取信息、行为建议以及合并筛选后的元数据
const { knowledges, actions, metadata } = await poly.query({
	query: '用户的偏好是什么？'
})

// knowledges[0] -> "..." (String)
// actions[0]    -> "..." (String)
// metadata       -> { links: ["..."], files: ["..."], desc: "..." }
```

#### 3. 🎯 **习惯性反应（快速路径）**

模拟“肌肉记忆”，Polywise 会根据用户输入和行为自动学习习惯。系统会随着时间的推移强化刺激与成功行动之间的连接。

```typescript
// 无需手动定义！
// 习惯是通过交互和强化学习自动形成的。
const { actions } = await poly.query({ query: '系统出错了！' })
// 如果已经形成了强习惯，actions[0] 将是 “触发紧急疏散程序”
```

#### 4. 🔭 **思维链（慢速路径）**

对于复杂查询，Polywise 可以迭代探索其记忆网络，通过扩散激活发现隐藏的连接。

```typescript
// 通过 cot_depth 开启思维链 (CoT) 探索
const { knowledges, actions, cot } = await poly.query({
	query: '如何优化内存使用？',
	cot_depth: 2
})

// 订阅思考过程
cot.on(event => {
	console.log(`发现了 ${event.knowledges.length} 条见解`)
	console.log(`最相关描述: ${event.metadata.desc}`)
})
```

---

## 🏗️ 架构

```
polywise/
├── packages/
│   ├── polywise/          # 核心记忆引擎
│   │   ├── src/
│   │   │   ├── Polywise.ts      # 数据库 API
│   │   │   ├── Brain.ts         # 生命周期管理器
│   │   │   ├── sql/             # SQL 操作
│   │   │   ├── types/           # 类型定义
│   │   │   └── utils/           # 工具函数
│   │   └── test/              # 测试
│   ├── app/               # React 前端
│   ├── desktop/           # Electron 壳
│   ├── erpc/              # IPC 层
│   └── stk/               # 共享工具包
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
4. ⚡ **刺激**：外部 input 激活节点并传播
5. 🔄 **习惯化**：成功的“行动”决策可被自动转化为“反应”习惯

### 🛠️ 关键 API 变更

- **Polywise.query()**：统一检索接口，返回简化后的 `knowledges` 和 `actions` (Array<string>)，以及通过 rerank 筛选后的单个 `metadata` 对象。
- **COTDepthResult**：思维链的每个深度现在返回简化后的字符串数组和最相关的元数据对象。
- **字段移除**：输出中移除了 `rerankScore`、`combinedScore`、`source` 等内部细节字段，仅保留核心内容。

### 🔄 状态机

Brain 在以下状态中运行：

- 🌱 **FRESH**：准备学习
- 🧠 **LEARNING**：处理新信息
- 😴 **TIRED**：需要巩固
- 🌙 **SLEEPING**：记忆巩固进行中

---

## 🛠️ 用法

### 1. 初始化子模块

确保所有子模块已正确初始化：

```bash
pnpm submodule:init
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 运行核心测试

验证核心记忆引擎：

```bash
pnpm --filter polywise test
```

### 4. 开发

Polywise 作为一个 Electron 应用程序运行。你需要同时启动前端和桌面进程：

```bash
# 在一个终端中，启动 React 前端
pnpm --filter app dev

# 在另一个终端中，启动 Electron 外壳
pnpm --filter desktop dev
```

### 5. 构建

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

- [Long-lasting potentiation of synaptic transmission (1973)](<papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 鸣谢

Polywise 站在这些优秀开源项目的肩膀上：

- 🐘 **[PGlite](https://github.com/electric-sql/pglite)** - 为本地优先应用打造的 Wasm 版 PostgreSQL
- ⚛️ **[React](https://react.dev/)** - 前端 UI 库
- 🖥️ **[Electron](https://www.electronjs.org/)** - 桌面应用框架
- 🔗 **[tRPC](https://trpc.io/)** - 端到端类型安全 API
- 📦 **[MobX](https://mobx.js.org/)** - 简单、可扩展的状态管理
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - 原子类 CSS 框架
- 🚀 **[Hono](https://hono.dev/)** - 极速 Web 框架
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - 基于 Rspack 的次世代构建工具
- 📚 **[Rslib](https://rslib.dev/)** - 由 Rsbuild 驱动的库构建工具

## 📜 开源协议

Modified Apache 2.0 - 详情请参见 [LICENSE](LICENSE)。
