# Polywise

基于神经科学启发的知识图谱与记忆系统。

## 核心思想

Polywise 将大脑的认知机制抽象为数学模型，通过软件系统模拟人类记忆的形成、巩固与遗忘过程。

### 1. 激活扩散理论

当刺激某个知识节点时，激活信号会沿着权重边向相邻节点扩散。这模拟了人类大脑中概念的联想过程：

- **节点**：代表概念、实体或知识点
- **边**：代表概念间的语义关联
- **权重**：表示关联强度，影响激活传播效率

### 2. 赫布学习法则

"一起激活的神经元会连接在一起"——使用越频繁的连接越强：

- **学习率**：边权重随激活频率的增长速度
- **衰减阻力**：边权重的抗遗忘能力

### 3. 记忆巩固与睡眠

类比人类睡眠期间的记忆重放与整合机制：

- **Shadow Tick**：空闲时随机唤醒弱连接，强化记忆
- **Sleep Tick**：执行记忆巩固——清除噪声、强化核心记忆、重置节点状态

### 4. 疲劳状态机

模拟大脑的认知资源有限性：

- **FRESH**：初始状态，可正常学习
- **LEARNING**：正在高强度学习，积累疲劳
- **TIRED**：疲劳累积过高，需要休息
- **SLEEPING**：睡眠巩固中

## 架构

```
packages/polywise/
├── src/
│   ├── Polywise.ts          # 核心数据库 API
│   ├── Brain.ts             # 生命周期管理器
│   ├── migration.ts         # 迁移系统
│   └── sql/
│       ├── schema.ts        # 数据库 schema 定义
│       ├── Brain.ts         # 核心 SQL 操作
│       ├── Polywise.ts      # API 层 SQL
│       └── meta.ts          # 元数据操作
├── test/
│   ├── test.spec.ts         # 功能测试
│   └── migration.spec.ts    # 迁移测试
└── package.json
```

### 技术栈

- **存储**：[PGlite](https://github.com/electric-sql/pglite) - WebAssembly PostgreSQL
- **测试**：[RSTest](https://github.com/web-infra-dev/rstest) - Rust 风格的测试框架
- **构建**：[Rslib](https://github.com/web-infra-dev/rslib) - 高性能打包工具

### 核心模块

| 模块        | 职责                                               |
| ----------- | -------------------------------------------------- |
| `Polywise`  | 数据库操作入口：节点/边的 CRUD、激活传播、知识注入 |
| `Brain`     | 生命周期管理：状态机、后台任务调度、疲劳控制       |
| `sql/`      | 所有 SQL 查询，保持业务逻辑与存储分离              |
| `migration` | Schema 版本管理与自动迁移                          |

## 用途

### 1. 将内容保存到记忆中

从文章或结构化数据中注入知识：

```typescript
const poly = new Polywise()
await poly.init({ data_dir: './my-memory' })

await poly.save({
	title: '量子计算',
	content: '量子计算利用量子力学现象...',
	triples: [
		{ subject: '量子比特', predicate: '利用', object: '叠加态', learning_rate: 2.5 },
		{ subject: '量子比特', predicate: '利用', object: '纠缠态', learning_rate: 2.4 }
	]
})
```

### 2. 从记忆中查询

根据自然语言或概念检索相关信息：

```typescript
const { knowledges, actions, metadata, cot } = await poly.query({
	query: '量子比特是如何工作的？',
	recall_depth: 2,
	cot_depth: 1
})

console.log(knowledges) // 简化后的知识字符串数组
console.log(metadata) // 合并并筛选后的最相关元数据（链接、文件等）
```

## API 速览

### Polywise

| 方法                             | 描述                           |
| -------------------------------- | ------------------------------ |
| `save(args: ProcessArticleArgs)` | 将内容和知识三元组保存到记忆中 |
| `query(args: QueryArgs)`         | 从记忆中查询相关的概念和上下文 |
| `init(args: PolywiseArgs)`       | 初始化数据库和后台大脑         |
| `off()`                          | 优雅地关闭后台任务并关闭数据库 |

## 后台机制

Polywise 运行一个内部“大脑”，在空闲时间处理维护任务，如记忆巩固（Sleep Tick）和强化（Shadow Tick）。当调用 `save` 或 `query` 时，这些任务会自动暂停或让出资源。

## 运行测试

```bash
pnpm --filter polywise run test
```

## 开源协议

MIT
