## V3

With the introduction of PFC (LMDB) and STR (LanceDB), your data flow will shift from "linear search" to a "dual-path/multi-path feedback control" architecture.

PFC acts as the "Command Center," utilizing LMDB's extreme read speeds (Memory-mapped I/O) to intercept tasks. STR handles reward-based habitual reactions, while your original Hippocampus logic settles into the background as "Deliberative" support.

Polywise Brain-Machine Architecture Data Flow:

```bash
          User Input (Input)
                ↓
┌──────────────────────────────────────────────┐
│  Phase 0: PFC Executive Gating               │
│  - LMDB Read: Current Session Context & Active Goals │
│  - State Update: Push new input onto Working Memory stack │
└──────────────────────────────────────────────┘
      ↓                      ↘
[ Habit Hit? ]             [ Miss / Complex Task ]
      ↓                      ↘
┌─────────────────────────┐    ┌──────────────────────────────────────────┐
│ Phase 1: STR Fast Response │    │ Phase 1: HIP Deep Association (Original Recall) │
│ - LanceDB: Vector Rule Match │    │ - Extract Keywords & Search Matching Nodes │
│ - Check Reward > Threshold  │    │ - Spreading Activation                   │
│ - If Hit, jump to Phase 4   │    │ - Get Graph Context                      │
└─────────────────────────┘    └──────────────────────────────────────────┘
      ↓                                      ↓
      ↓                        ┌──────────────────────────────────────────┐
      ↓                        │ Phase 2: HIP External Lookup             │
      ↓                        │ - pglite: Vector & Full-text Search      │
      ↓                        │ - Knowledge Base Completion              │
      └─────────────────────────┴──────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Aggregation & Weight Balancing                                  │
│ - Conflict Detection: If STR conflicts with HIP, PFC arbitrates by confidence │
│ - Shadow Update: On STR hit, async weight reinforcement to pglite (Keep-alive) │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Reranking & Dopamine Tagging                                    │
│ - Pipeline.rerank: Inject strategy weights                               │
│ - Generate Task_ID for decision, store in PFC (LMDB), await feedback     │
└──────────────────────────────────────────────────────────────────────────┐
      ↓
   Response ───→ [ Observe User Reaction ]
                             ↓
                 ┌──────────────────────────────────┐
                 │ Phase 5: Striatal Learning       │
                 │ - Calculate Reward               │
                 │ - Update STR (LanceDB) Weights   │
                 │ - Trigger HIP (pglite) Consolidation │
                 └──────────────────────────────────┘
```

Implementation Details:

1.    **PFC (LMDB - Memory-mapped Storage)**:
      - **Stored Content**: `current_task_id`, `working_memory_tokens`, `active_goals`.
      - **Advantage**: LMDB is faster than any database for small, high-frequency data, providing ACID guarantees for context.

2.    **STR (LanceDB - Policy Table)**:
      - **Stored Content**: `embedding(state) | action_type | reward_score | timestamp`.
      - **Logic**: Acts as a "Shortcut Library." If `state` similarity is high and `reward_score` is excellent, results are pulled directly, bypassing complex graph traversal.

3.    **HIP (pglite - Association Graph)**:
      - **Role**: Remains the core. When encountering "unseen" instructions, PFC commands HIP to perform large-scale association and external search.

Core Change: Self-Learning Feedback Loop

With this architecture, **Phase 5** is the key to system evolution.

- **Credit Assignment**: If the user says "Good job," PFC retrieves `last_task_id` from LMDB, finds the corresponding LanceDB record in STR, and increases its `reward_score`.
- **Hotspot Maintenance**: This feedback solves the "cache vs. hippocampus" problem—**every successful STR call is recorded and feeds back into the Hippocampus during the "Sleep Period."**

## V2

Adding COT: Deep Chain of Thought based on multi-layer structure

```bash
Depth 0: Initial query → result[0]
         ↓
Depth 1: Emerged query (based on result[0].title)
         Recall depth +1 → Search → Aggregate → Rerank → Stimulate
         ↓
Depth 2: Emerged query (based on new result[0].title)
         Recall depth +2 → Search → Aggregate → Rerank → Stimulate
         ↓
Depth 3: Continue until max depth...
```

## V1

```bash
User Input
    ↓
┌─────────────────────────────────────┐
│  Phase 1: Recall                    │
│  - Extract Keywords                 │
│  - Search Matching Nodes            │
│  - Traverse Related Nodes/Edges     │
│  - Strengthen Nodes                 │
│  - Get Graph Context                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Phase 2: External Lookup           │
│  - Vector Search (Article.searchVector) │
│  - Full-text Search (Article.searchFts) │
│  - Merge & Deduplicate              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Phase 3: Aggregation               │
│  - Weight Memory Sources            │
│  - Integrate External Results       │
│  - Add Implicit Candidates          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Phase 4: Reranking                 │
│  - Pipeline.rerank                  │
│  - Calculate Composite Scores        │
│  - Sort and Return                  │
└─────────────────────────────────────┘
    ↓
Return QueryResult[]
```
