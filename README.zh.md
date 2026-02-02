<p align="center">
  <img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Polywise</p>

_<p align="center"><strong>🧠 神经科学启发的知识图谱与记忆系统</strong></p>_

<p align="center">
  <a href="README.md">English</a> |
  简体中文
</p>

## 💡 为什么需要 Polywise？

目前的 AI 系统缺乏**真正的记忆**。每次交互都是孤立的，知识无法演化——它们只是被存储，而不是被理解。Polywise 通过实现一个**受神经科学启发的记忆引擎**改变了这一点：

- 🧠 **累积学习**：AI 会记住每一次对话，并随之成长。
- 🔗 **联想图谱**：知识以相互连接的概念形式存储，而非孤立的片段。
- 🌙 **记忆巩固**：模仿人类睡眠，强化重要记忆并修剪无用噪声。
- ⚡ **激活扩散**：思维通过有机流动，自然地触发相关联想。

> 我们不只是在构建一个数据库。我们在为 AI 构建一个**数字海马体**。

---

## 🤝 Polywise 与 AI

### 🧩 缺失的拼图

当前的 AI 架构缺少一个关键组件：**类似海马体的记忆系统**。虽然 LLM 在模式匹配和文本生成方面表现出色，但它们缺乏：

- 🎭 **情景记忆** - 记住特定的交互和事件
- 🌐 **语义网络** - 理解概念之间的相互关系
- 🔄 **巩固机制** - 将短期交互转化为长期知识
- 🔍 **联想回忆** - 通过连接而非仅相似性来检索信息

### 🚀 Polywise 如何增强 AI

#### 1. 🧠 **AI 智能体的长期记忆**

```typescript
// AI 智能体记住之前的交互
const poly = new Polywise({ data_dir: ':memory:' })

// 从对话中处理知识
await poly.processArticle('用户偏好', '用户喜欢深色模式，偏爱 TypeScript，工作时间较晚', [
	{ subject: '用户', predicate: '偏爱', object: '深色模式', learning_rate: 2.0 },
	{ subject: '用户', predicate: '喜欢', object: 'TypeScript', learning_rate: 2.5 }
])

// 之后，AI 回忆起相关偏好
const related = await poly.getNodesByIdol('user_001')
// 自动包括：深色模式、TypeScript、夜间工作
```

#### 2. 📚 **知识累积**

每次交互都会强化知识图谱：

- **重复的概念** 形成更强的连接
- **相关主题** 有机地聚集在一起
- **重要信息**（高 learning_rate）持续更久
- **噪声** 在"睡眠"期间自然衰减并被修剪

#### 3. 🎯 **情境感知检索**

Polywise 不是简单的向量相似性，而是使用**扩散激活**：

```typescript
// 刺激一个概念
await poly.stimulate(node_id, 5.0)

// 激活通过网络传播
await poly.tick() // 思维流向连接的概念

// 检索激活的上下文
const { nodes, edges } = await poly.getSnapshot()
// 返回的不仅是查询，还有语义相关的概念
```

#### 4. 🌙 **记忆巩固**

像人类睡眠一样，Polywise 有一个巩固阶段：

```typescript
const brain = new Brain(poly)

// 高强度学习后
await brain.triggerInputBurst(100)

// 空闲时，大脑进入"睡眠"
await brain.triggerSleepTick()
// 强化重要记忆，修剪弱连接
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
4. ⚡ **刺激**：外部输入激活节点并传播

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

Polywise 的构建基于这样的信念：**真正智能的 AI 需要真正智能的记忆**。不仅仅是存储，而是一个能够：

- 有机地形成连接
- 随使用而增强
- 战略性地遗忘
- 通过梦想巩固
- 持续演化的系统

我们不只是构建一个数据库。我们正在构建一个**数字海马体**。

---

## 📄 参考文献

本项目受以下研究论文启发：

- [Long-lasting potentiation of synaptic transmission (1973)](<papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>) - 赫布学习的基石
- [The Organization of Behavior (1949)](<papers/The%20Organization%20of%20Behavior%20(1949).pdf>) - Donald Hebb 的开创性著作
- [A Spreading-Activation Theory of Semantic Processing (1975)](<papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>) - Collins & Loftus 的扩散激活理论
- [Spreading Activation in Emotional Memory Networks (2016)](<papers/Spreading%20Activation%20in%20Emotional%20Memory%20Networks%20(2016).pdf>) - 现代激活理论

## 🙏 鸣谢

Polywise 基于这些优秀的技术构建：

- 🗄️ [PGlite](https://github.com/electric-sql/pglite) - 浏览器内的 PostgreSQL
- ⚛️ [React](https://react.dev/) - UI 框架
- 📱 [Electron](https://www.electronjs.org/) - 跨平台桌面应用
- 🔄 [tRPC](https://trpc.io/) - 端到端类型安全 API
- 🎯 [MobX](https://mobx.js.org/) - 状态管理
- 🎨 [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- 🌊 [Hono](https://hono.dev/) - Web 框架
- 🏗️ [Rsbuild](https://rsbuild.dev/) & [Rslib](https://rslib.dev/) - 构建工具

## 📜 开源协议

Modified Apache 2.0 - 详情请参见 [LICENSE](LICENSE)。
