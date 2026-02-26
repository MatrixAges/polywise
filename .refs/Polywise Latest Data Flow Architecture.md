Polywise's data flow architecture is a **Cortex-based hybrid retrieval system** with iterative search capabilities.

The following is the actual data flow diagram based on the code logic:

```bash
          User Input (Input)
                ↓
┌──────────────────────────────────────────────┐
│  Phase 0: Cortex Executive Gating            │
│  - Check cot_depth parameter                 │
│  - Initialize ChainEmitter                   │
└──────────────────────────────────────────────┘
      ↓                      ↘
[cot_depth <= 1]          [cot_depth > 1]
(Single Search)           (Iterative Search)
      ↓                      ↘
      ↓                   ┌──────────────────────────────────────────┐
      ↓                   │ Phase 0.5: Iterative Search Loop         │
      ↓                   │ - Execute search with current query      │
      ↓                   │ - Filter results by quality threshold    │
      ↓                   │ - Collect unique results                 │
      ↓                   │ - Generate next query (keywords)         │
      ↓                   │ - Repeat until depth exhausted           │
      ↓                   └──────────────────────────────────────────┘
      └───────────────────┴──────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Hybrid Retrieval - executeSingleSearch                          │
│ - Graph Recall: recall (Keywords -> Nodes -> Spreading)        │
│ - External Search: Article.searchVector & searchFts (Pipeline Embedding) │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Aggregation & Quality Filter                                    │
│ - aggregateResults: Merge Recall and Search results                      │
│ - Deduplication by ID                                                    │
│ - Filter: combinedScore >= threshold                                     │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Reranking                                                       │
│ - Pipeline.rerank: Semantic scoring of Knowledge candidates              │
│ - Result Truncation (rerank_limit)                                       │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
   Response ───→ [Write Log: Log.write]
                             ↓
                 ┌──────────────────────────────────┐
                 │ Phase 4: Brain Lifecycle         │
                 │ - Brain.ts: Manage state         │
                 │ - Idle Detection -> Trigger Sleep│
                 │   - SQL: Decay/Prune/Replay      │
                 └──────────────────────────────────┘
```

### Iterative Search (CoT Mode)

When `cot_depth > 1`, the system performs iterative search:

1. **Initial Query**: Start with user's original query
2. **Search & Filter**: Execute hybrid search, filter by `combinedScore >= 0.4`
3. **Collect**: Add unique results to collection (deduplication by ID)
4. **Generate Next Query**: Extract keywords from new results, combine with original query
5. **Repeat**: Continue until `cot_depth` iterations or no new results
6. **Final Filter**: Apply stricter threshold (`combinedScore >= 0.5`)

**Stopping Conditions**:

- Reached `cot_depth` limit
- No new high-quality results found
- Generated query already used (avoid loops)

### Implementation Details

1.    **Cortex (src/Cortex.ts)**:
      - **Core Logic**: Routes to `executeSingleSearch` or `executeIterativeSearch` based on `cot_depth`
      - **Iterative Search**: Keyword-based query expansion without LLM
      - **Quality Control**: Multi-stage filtering with rerank scores

2.    **Pipeline (src/Pipeline.ts)**:
      - **AI Capabilities**: Provides `embed` and `rerank` for vector operations
      - **Queue Management**: Uses `PQueue` for concurrency control

3.    **Brain (src/Brain.ts)**:
      - **State Machine**: Maintains system states and lifecycle
      - **Maintenance**: Maintains graph health via `runShadowTick` and `triggerSleepTick`

4.    **Hybrid Search (src/Polywise.ts)**:
      - **Unified Entry**: `executeSingleSearch` aggregates all information sources
      - **Article**: `src/Article.ts` handles vector and full-text retrieval for raw documents

---

This is the complete system data flow diagram integrating **LIF Neuro-dynamic properties** (`potential`, `threshold`, `activation`).

```bash
          User Input (Input)
                ↓
┌──────────────────────────────────────────────┐
│  Phase 0: Cortex Executive Gating            │
│  - Check cot_depth parameter                 │
│  - Initialize ChainEmitter                   │
└──────────────────────────────────────────────┘
      ↓                      ↘
[cot_depth <= 1]          [cot_depth > 1]
(Single Search)           (Iterative Search)
      ↓                      ↘
      ↓                   ┌──────────────────────────────────────────┐
      ↓                   │ Phase 0.5: Iterative Search Loop         │
      ↓                   │ - Search → Filter → Collect → Expand     │
      ↓                   │ - Keyword extraction for query gen       │
      ↓                   └──────────────────────────────────────────┘
      └───────────────────┴──────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Hybrid Retrieval & Neuro-Dynamics                                           │
│                                                                                      │
│  [A. Stimulus Injection]                                                             │
│   - Graph Recall: recall -> stimulateNodes(node_ids)                       │
│        ↓                                                                             │
│        └── SQL: UPDATE nodes SET potential = potential + Intensity                   │
│                                                                                      │
│  [B. LIF Cycle: Potential/Threshold/Activation]                                      │
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
│  [C. Standard Retrieval]                                                             │
│   - External Search: Article.searchVector & searchFts (Pipeline Embedding)           │
└──────────────────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Aggregation & Quality Filter                                    │
│ - aggregateResults: Merge Recall (Activated Nodes), Search               │
│ - Deduplication & Normalization                                          │
│ - Quality Filter: combinedScore >= threshold                             │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Reranking                                                       │
│ - Pipeline.rerank: Semantic scoring of Knowledge candidates              │
│ - Result Truncation (rerank_limit)                                       │
└──────────────────────────────────────────────────────────────────────────┘
      ↓
   Response ───→ [Write Log: Log.write]
                             ↓
                 ┌──────────────────────────────────┐
                 │ Phase 4: Brain Lifecycle         │
                 │ - Brain.ts: Manage state         │
                 │ - Idle Detection -> Trigger Sleep│
                 │   - SQL: Decay/Prune/Replay      │
                 └──────────────────────────────────┘
```

### Summary of Property Flow

Three properties play decisive roles in this process:

1.    **Stimulus Phase**: `potential` acts as the **Energy Container**, receiving energy injections.
2.    **Check Phase**: `threshold` acts as the **Gating Mechanism**, determining if energy is sufficient to trigger system "attention."
3.    **Firing Phase**: `activation` acts as the **Signal Light**. Once lit (set to 1.0), the node is included in retrieval results (Phase 2), triggers Hebbian learning, and spreads energy to neighbors.
