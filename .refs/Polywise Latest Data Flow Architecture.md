Polywise's data flow architecture is a **Cortex-based hybrid retrieval and iterative planning system**.

The following is the actual data flow diagram based on the code logic:

```bash
          User Input (Input)
                ↓
┌──────────────────────────────────────────────┐
│  Phase 0: Cortex Executive Gating            │
│  - Check cot_depth parameter                 │
│  - Initialize ChainEmitter & WorkingMemory   │
└──────────────────────────────────────────────┘
      ↓                      ↘
[ cot_depth <= 0 ]        [ cot_depth > 0 ]
(Fast Path)               (CoT Planning Loop)
      ↓                      ↘
      ↓                   ┌──────────────────────────────────────────┐
      ↓                   │ Phase 0.5: Iterative Planning            │
      ↓                   │ - Pipeline.decide: Generate Next Step Query │
      ↓                   │ - Loop Phase 1-3 until depth exhausted   │
      ↓                   │ - Update Working Memory                  │
      └───────────────────┴──────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Hybrid Retrieval - executeSingleSearch                          │
│ - Habit Reaction: getHabits & handleHabitReaction (Stimulate Nodes)      │
│ - Graph Recall: recallFromMemory (Keywords -> Nodes -> Spreading -> Context) │
│ - External Search: Article.searchVector & searchFts (Pipeline Embedding) │
│ - Memory Search: Memory.search (LTM & Diary)                             │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Aggregation                                                     │
│ - aggregateResults: Merge Recall, Search, Memory, Habits                 │
│ - Deduplication & Normalization                                          │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Reranking                                                       │
│ - Pipeline.rerank: Semantic scoring of Knowledge and Action candidates   │
│ - Result Truncation (rerank_limit)                                       │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
   Response ───→ [ Write Log: Log.write ]
                             ↓
                 ┌──────────────────────────────────┐
                 │ Phase 4: Brain Lifecycle         │
                 │ - Brain.ts: Increase Synaptic Fatigue │
                 │ - Idle Detection -> Trigger Sleep│
                 │   - memory.saveDiary: Save Diary │
                 │   - consolidateLongTermMemory    │
                 │   - SQL: Decay/Prune/Replay      │
                 └──────────────────────────────────┘
```

### Implementation Details

1.    **Cortex (src/Cortex.ts)**:
      - **Core Logic**: The `process()` method decides between `executeFastPath` or `runPlanningLoop`.
      - **Planning**: Uses `pipeline.decide` and `WorkingMemory` for Chain of Thought (CoT).

2.    **Pipeline (src/Pipeline.ts)**:
      - **AI Capabilities**: Provides `embed`, `rerank`, and `decide` (LLM).
      - **Queue Management**: Uses `PQueue` for concurrency.

3.    **Brain (src/Brain.ts)**:
      - **State Machine**: Maintains `FRESH` -> `TIRED` -> `SLEEPING` states.
      - **Maintenance**: Maintains graph health via `runShadowTick` and `triggerSleepTick`.

4.    **Hybrid Search (src/Polywise.ts)**:
      - **Unified Entry**: `executeSingleSearch` aggregates all information sources.
      - **Memory**: `src/Memory.ts` handles LTM and STM storage.
      - **Article**: `src/Article.ts` handles vector and full-text retrieval for raw documents.

---

This is the complete system data flow diagram integrating **LIF Neuro-dynamic properties** (`potential`, `threshold`, `activation`).

```bash
          User Input (Input)
                ↓
┌──────────────────────────────────────────────┐
│  Phase 0: Cortex Executive Gating            │
│  - Check cot_depth parameter                 │
│  - Initialize ChainEmitter & WorkingMemory   │
└──────────────────────────────────────────────┘
      ↓                      ↘
[ cot_depth <= 0 ]        [ cot_depth > 0 ]
(Fast Path)               (CoT Planning Loop)
      ↓                      ↘
      ↓                   ┌──────────────────────────────────────────┐
      ↓                   │ Phase 0.5: Iterative Planning            │
      ↓                   │ - Pipeline.decide: Generate Next Step Query │
      ↓                   │ - Loop Phase 1-3 until depth exhausted   │
      ↓                   │ - Update Working Memory                  │
      └───────────────────┴──────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Hybrid Retrieval & Neuro-Dynamics                                           │
│                                                                                      │
│  [ A. Stimulus Injection ]                                                           │
│   - Habit Reaction: handleHabitReaction -> stimulate(node_id)                        │
│   - Graph Recall: recallFromMemory -> stimulateNodes(node_ids)                       │
│        ↓                                                                             │
│        └── SQL: UPDATE nodes SET potential = potential + Intensity                   │
│                                                                                      │
│  [ B. LIF Cycle: Potential/Threshold/Activation ]                                    │
│    Node (potential, threshold)                                                       │
│        ↓                                                                             │
│    1. Integrate: potential accumulates with stimulus                                 │
│        ↓                                                                             │
│    2. Check: Is potential > threshold (0.5)?                                         │
│        ├─ [NO] ──→ Decay: potential decreases over time                              │
│        │                                                                             │
│        └─ [YES] ─→ Fire!:                                                            │
│             - Mutation: activation = 1.0 (Lit), potential = 0.0 (Reset)              │
│             - Spreading: Propagate energy to neighbors                               │
│             - Hebbian: strengthenRelatedEdges (Weight++)                             │
│                                                                                      │
│  [ C. Standard Retrieval ]                                                           │
│   - External Search: Article.searchVector & searchFts (Pipeline Embedding)           │
│   - Memory Search: Memory.search (LTM & Diary)                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Aggregation                                                     │
│ - aggregateResults: Merge Recall (Activated Nodes), Search, Memory, Habits│
│ - Deduplication & Normalization                                          │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Reranking                                                       │
│ - Pipeline.rerank: Semantic scoring of Knowledge and Action candidates   │
│ - Result Truncation (rerank_limit)                                       │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
   Response ───→ [ Write Log: Log.write ]
                             ↓
                 ┌──────────────────────────────────┐
                 │ Phase 4: Brain Lifecycle         │
                 │ - Brain.ts: Increase Synaptic Fatigue │
                 │ - Idle Detection -> Trigger Sleep│
                 │   - memory.saveDiary: Save Diary │
                 │   - consolidateLongTermMemory    │
                 │   - SQL: Decay/Prune/Replay      │
                 └──────────────────────────────────┘
```

### Summary of Property Flow

Three properties play decisive roles in this process:

1.    **Stimulus Phase**: `potential` acts as the **Energy Container**, receiving energy injections.
2.    **Check Phase**: `threshold` acts as the **Gating Mechanism**, determining if energy is sufficient to trigger system "attention."
3.    **Firing Phase**: `activation` acts as the **Signal Light**. Once lit (set to 1.0), the node is included in retrieval results (Phase 2), triggers Hebbian learning, and spreads energy to neighbors.
