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

Polywise 允许 AI 智能体记住每一次对话并随之成长，将短期交互转化为长期知识。

```typescript
const poly = new Polywise()
await poly.init({ data_dir: './my-memory' })

// 从对话中保存知识
await poly.save({
	title: '用户偏好',
	content: '用户喜欢深色模式，偏爱 TypeScript，工作时间较晚',
	triples: [
		{ subject: '用户', predicate: '偏爱', object: '深色模式', learning_rate: 2.0 },
		{ subject: '用户', predicate: '喜欢', object: 'TypeScript', learning_rate: 2.5 }
	]
})

// 之后，AI 查询相关偏好
const { result } = await poly.query({ query: '用户喜欢什么？' })
// 自动检索出：深色模式、TypeScript 等
```

#### 2. ⚡ **快速反应与深度思考 (STR/PFC)**

Polywise 实现了模拟前额叶皮层 (PFC) 和纹状体 (STR) 的双重处理系统，用于适应性行为决策：

```typescript
// 1. 订阅“慢系统”(PFC) 的优化决策回调
poly.onAction(result => {
	console.log('PFC 优化决策:', result)
})

// 2. 触发反应 (STR - 快系统路径)
const response = await poly.react('检测到严重系统故障')
// 如果内存中存在“习惯规则”，将毫秒级立即返回
```

- **React (反应)**：基于“肌肉记忆”（习惯边）的即时刺激响应。
- **Act (行动)**：在反应后启动的异步深度推理，用于修正或优化初始响应。

#### 3. 🎯 **情境感知检索**

Polywise 不是简单的向量相似性，而是在查询过程中通过**扩散激活**内部探索概念的语义邻域。

```typescript
// 查询触发内部的扩散激活
const { result, cot } = await poly.query({
	query: '系统如何处理记忆？',
	recall_depth: 2,
	cot_depth: 1 // 启用思维链（CoT）探索
})

// result 包含语义相关的概念及其来源上下文
```

#### 4. 🌙 **记忆巩固**

Polywise 自主管理其生命周期。诸如“睡眠”巩固之类的维护任务在系统空闲时自动运行，并在前台任务到达时自动让出资源。

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
4. ⚡ **刺激**：外部输入激活节点并传播
5. 🔄 **习惯化**：成功的“行动”决策可被自动转化为“反应”习惯

### 🔄 状态机

Brain 在以下状态中运行：

- 🌱 **FRESH**：准备学习
- 🧠 **LEARNING**：处理新信息
- 😴 **TIRED**：需要巩固
- 🌙 **SLEEPING**：记忆巩固进行中

---

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm --filter polywise run test

# 启动开发
pnpm dev
```

## 💭 理念

Polywise 的构建基于这样的信念：**真正智能的 AI 需要真正智能的记忆**。不仅仅是存储，而是一个能够有机地形成连接、随使用而增强、战略性地遗忘并持续演化的系统。

---

## 📄 参考文献

本项目受以下研究论文启发：

- [Long-lasting potentiation of synaptic transmission (1973)](<papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 鸣谢

Polywise 基于 [PGlite](https://github.com/electric-sql/pglite), [React](https://react.dev/), [Electron](https://www.electronjs.org/), [tRPC](https://trpc.io/), [MobX](https://mobx.js.org/), [Tailwind CSS](https://tailwindcss.com/), [Hono](https://hono.dev/), [Rsbuild](https://rsbuild.dev/) 以及 [Rslib](https://rslib.dev/) 构建。

## 📜 开源协议

Modified Apache 2.0 - 详情请参见 [LICENSE](LICENSE)。
