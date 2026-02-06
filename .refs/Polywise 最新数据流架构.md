Polywise 的数据流架构是**基于 Cortex 的混合检索与迭代规划系统**。

以下是根据代码逻辑绘制的实际数据流图：

```bash
          用户输入 (Input)
                ↓
┌──────────────────────────────────────────────┐
│  Phase 0: Cortex 任务门控 (Executive Gating) │
│  - 检查 cot_depth 参数                       │
│  - 初始化 ChainEmitter & WorkingMemory       │
└──────────────────────────────────────────────┘
      ↓                      ↘
[ cot_depth <= 0 ]        [ cot_depth > 0 ]
(Fast Path)               (CoT Planning Loop)
      ↓                      ↘
      ↓                   ┌──────────────────────────────────────────┐
      ↓                   │ Phase 0.5: 迭代规划 (Planning)           │
      ↓                   │ - Pipeline.decide: 生成 Next Step Query  │
      ↓                   │ - 循环执行 Phase 1-3 直到深度耗尽        │
      ↓                   │ - 更新工作记忆 (Working Memory)          │
      ↓                   └──────────────────────────────────────────┘
      ↓                                      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 1: 混合检索 (Hybrid Retrieval) - executeSingleSearch               │
│ - 习惯反应: getHabits & handleHabitReaction (刺激节点)                   │
│ - 图谱回想: recallFromMemory (关键词 -> 节点 -> 扩散激活 -> 上下文)      │
│ - 外部搜索: Article.searchVector & searchFts (Pipeline 嵌入)             │
│ - 记忆检索: Memory.search (LTM & Diary)                                  │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 2: 结果聚合 (Aggregation)                                          │
│ - aggregateResults: 合并 Recall, Search, Memory, Habits                  │
│ - 去重与标准化                                                           │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3: 重排序 (Reranking)                                              │
│ - Pipeline.rerank: 对 Knowledge 和 Action 候选进行语义打分               │
│ - 截断结果 (rerank_limit)                                                │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
   返回结果 (Response) ───→ [ 写入日志 Log.write ]
                            ↓
                ┌──────────────────────────────────┐
                │ Phase 4: 脑部生命周期 (Lifecycle)│
                │ - Brain.ts: 增加突触负载 (Fatigue)│
                │ - 闲置检测 -> 触发睡眠 (Sleep)   │
                │   - memory.saveDiary: 保存日记   │
                │   - consolidateLongTermMemory    │
                │   - SQL: Decay/Prune/Replay      │
                └──────────────────────────────────┘
```

### 代码实现映射 (Implementation Details)

1.    **Cortex (src/Cortex.ts)**:
      - **核心逻辑**: `process()` 方法决定走 `executeFastPath` 还是进入 `runPlanningLoop`。
      - **规划能力**: 利用 `pipeline.decide` 和 `WorkingMemory` 实现多轮思考（CoT）。

2.    **Pipeline (src/Pipeline.ts)**:
      - **AI 算力**: 提供 `embed` (Embedding), `rerank` (Reranker), `decide` (LLM) 三大核心能力。
      - **任务队列**: 使用 `PQueue` 管理并发。

3.    **Brain (src/Brain.ts)**:
      - **状态机**: 维护 `FRESH` -> `TIRED` -> `SLEEPING` 状态。
      - **后台维护**: 通过 `runShadowTick` (阴影更新) 和 `triggerSleepTick` (睡眠整理) 维护图谱健康。

4.    **Hybrid Search (src/Polywise.ts)**:
      - **统一入口**: `executeSingleSearch` 聚合了所有信息源。
      - **Memory**: `src/Memory.ts` 负责长短期记忆存储。
      - **Article**: `src/Article.ts` 负责原始文档的向量和全文检索。

---

这是整合了 **LIF 神经动力学属性**（`potential`, `threshold`, `activation`）的完整系统数据流图。我保留了所有原有阶段，并在 **Phase 1** 中详细展开了节点刺激与激发的微观流程。

```bash
          用户输入 (Input)
                ↓
┌──────────────────────────────────────────────┐
│  Phase 0: Cortex 任务门控 (Executive Gating) │
│  - 检查 cot_depth 参数                       │
│  - 初始化 ChainEmitter & WorkingMemory       │
└──────────────────────────────────────────────┘
      ↓                      ↘
[ cot_depth <= 0 ]        [ cot_depth > 0 ]
(Fast Path)               (CoT Planning Loop)
      ↓                      ↘
      ↓                   ┌──────────────────────────────────────────┐
      ↓                   │ Phase 0.5: 迭代规划 (Planning)           │
      ↓                   │ - Pipeline.decide: 生成 Next Step Query  │
      ↓                   │ - 循环执行 Phase 1-3 直到深度耗尽        │
      ↓                   │ - 更新工作记忆 (Working Memory)          │
      ↓                   └──────────────────────────────────────────┘
      ↓                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: 混合检索与神经动力学 (Hybrid Retrieval & Neuro-Dynamics)                    │
│                                                                                      │
│  [ A. 刺激注入 (Stimulus Injection) ]                                                │
│   - 习惯反应: handleHabitReaction -> stimulate(node_id)                              │
│   - 图谱回想: recallFromMemory -> stimulateNodes(node_ids)                           │
│        ↓                                                                             │
│        └── SQL: UPDATE nodes SET potential = potential + Intensity                   │
│                                                                                      │
│  [ B. 神经元响应循环 (LIF Cycle: Potential/Threshold/Activation) ]                   │
│    Node (potential, threshold)                                                       │
│        ↓                                                                             │
│    1. 积分 (Integrate): potential 随刺激累积                                         │
│        ↓                                                                             │
│    2. 判定 (Check): Is potential > threshold (0.5)?                                  │
│        ├─ [NO] ──→ 衰减 (Decay): potential 随时间减少                                │
│        │                                                                             │
│        └─ [YES] ─→ 激发 (Fire!):                                                     │
│             - 状态突变: activation = 1.0 (点亮), potential = 0.0 (重置)              │
│             - 扩散激活: 向邻居传播能量 (Spreading Activation)                        │
│             - 赫布强化: strengthenRelatedEdges (Weight++)                            │
│                                                                                      │
│  [ C. 常规检索 (Standard Retrieval) ]                                                │
│   - 外部搜索: Article.searchVector & searchFts (Pipeline 嵌入)                       │
│   - 记忆检索: Memory.search (LTM & Diary)                                            │
└──────────────────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 2: 结果聚合 (Aggregation)                                          │
│ - aggregateResults: 合并 Recall(Activated Nodes), Search, Memory, Habits │
│ - 去重与标准化                                                           │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3: 重排序 (Reranking)                                              │
│ - Pipeline.rerank: 对 Knowledge 和 Action 候选进行语义打分               │
│ - 截断结果 (rerank_limit)                                                │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
   返回结果 (Response) ───→ [ 写入日志 Log.write ]
                            ↓
                ┌──────────────────────────────────┐
                │ Phase 4: 脑部生命周期 (Lifecycle)│
                │ - Brain.ts: 增加突触负载 (Fatigue)│
                │ - 闲置检测 -> 触发睡眠 (Sleep)   │
                │   - memory.saveDiary: 保存日记   │
                │   - consolidateLongTermMemory    │
                │   - SQL: Decay/Prune/Replay      │
                └──────────────────────────────────┘
```

### 属性流转小结

在这个流程中，您提到的三个属性发挥了决定性作用：

1.    **刺激阶段**: `potential` 充当**能量容器**，接收来自 `handleHabitReaction` 和 `recallFromMemory` 的能量注入。
2.    **判定阶段**: `threshold` 充当**门控**，决定了这些能量是否足以引起系统的“注意”。
3.    **激发阶段**: `activation` 充当**信号灯**，一旦点亮（置为 1.0），该节点不仅会被纳入最终的检索结果（Phase 2），还会触发赫布学习（强化连接），并向周围扩散能量。
