<p align="right"><a href="README.zh.md">中文</a> | English</p>

<p align="center">
  <img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Polywise</p>

<p align="center"><strong>Agentic Memory Engine</strong></p>

<p align="center">
  <a href="https://github.com/MatrixAges/polywise/stargazers"><img src="https://img.shields.io/github/stars/MatrixAges/polywise?style=rounded&color=795548" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <a href="https://x.com/xiewendao"><img src="https://img.shields.io/badge/FollowX-XWD-green?logo=Twitter" alt="Twitter"></a>
</p>

## 💡 Why Polywise?

Current AI architectures are missing a critical component: **a hippocampus-like memory system**. While LLMs excel at pattern matching and text generation, they lack true, evolving memory. Each interaction is often isolated, meaning knowledge doesn't evolve—it's just stored.

Polywise changes this by implementing a **neuroscience-inspired memory engine** that serves as the "digital hippocampus" for modern AI:

- 🎭 **Episodic & Semantic Memory**: Remembers specific interactions and understands how concepts relate to each other.
- 🔗 **Associative Graph**: Knowledge is stored as interconnected concepts, not isolated bits.
- ⚡ **Spreading Activation**: One thought naturally triggers related ones through organic flow, enabling associative recall through connections rather than just vector similarity.
- 🌙 **Consolidation**: Like human sleep, it reinforces important memories and prunes noise through a structured lifecycle.
- 🔄 **Iterative Search**: Chain of Thought (CoT) mode performs multiple search iterations with keyword expansion for comprehensive retrieval.

---

## 🚀 How Polywise Enhances AI

#### 1. 🧠 **Long-Term Memory for AI Agents**

Polywise allows AI agents to remember and grow with every conversation, converting episodic interactions into structured semantic knowledge.

```typescript
const poly = new Polywise()
await poly.init({
	data_dir: './my-memory',
	idol_id: 'user_123',
	root_ids: ['global_knowledge']
})

// Filters can be updated at any time
poly.setFilters({ idol_id: 'user_456' })

// Save episodic memory (content)
// Uses class-level filters (idol_id, root_ids) by default
await poly.save({
	content: 'User prefers TypeScript and works late at night.'
})

// Retrieve relevant information with context-aware search
const { memory, metadata } = await poly.query({
	query: 'What are the user preferences?'
})
```

#### 2. ⚡ **Unified Hybrid Retrieval**

Polywise implements a unified retrieval system combining graph-based memory recall with vector and full-text search.

```typescript
// Single search (fast)
const { memory, metadata } = await poly.query({
	query: 'What are the user preferences?',
	cot_depth: 1
})

// Iterative search (comprehensive)
const { memory, metadata } = await poly.query({
	query: 'microservices architecture patterns',
	cot_depth: 3, // Number of iterations
	recall_depth: 2, // Graph traversal depth
	search_limit: 20, // Max results per iteration
	rerank_limit: 10 // Final result limit
})

// memory[0] -> "..." (String)
// metadata       -> { links: ["..."], files: ["..."], desc: "..." }
```

#### 3. 🔭 **Chain of Thought (Iterative Search)**

For complex queries, Polywise can explore the knowledge network iteratively, expanding queries with discovered keywords.

```typescript
// Enable Chain of Thought (CoT) with cot_depth
const { memory, metadata, cot } = await poly.query({
	query: 'How to optimize memory usage?',
	cot_depth: 3, // Perform 3 search iterations
	search_limit: 5, // Results per iteration
	rerank_limit: 10 // Final results after reranking
})

// Subscribe to the iteration progress
cot.on(event => {
	console.log(`Found ${event.memory.length} insights`)
	console.log(`Top Description: ${event.metadata.desc}`)
})
```

**How Iterative Search Works:**

1. Search with current query
2. Filter results by quality threshold (rerank score >= 0.4)
3. Collect unique high-quality results
4. Extract keywords and expand query
5. Repeat until iteration limit or convergence

**Quality Control:**

- Stage 1: Filter by `combinedScore >= 0.4`
- Stage 2: Final filter by `combinedScore >= 0.5`
- Deduplication by content ID across iterations

---

## 🏗️ Architecture

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
      ↓                   │ - Filter by quality threshold            │
      ↓                   │ - Collect unique results                 │
      ↓                   │ - Expand query with keywords             │
      ↓                   │ - Repeat until depth exhausted           │
      └───────────────────┴──────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Hybrid Retrieval - executeSingleSearch                          │
│ - Graph Recall: recallFromMemory (Keywords -> Nodes -> Spreading)        │
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
   Response ───→ [ Write Log: Log.write ]
                             ↓
                  ┌──────────────────────────────────┐
                  │ Phase 4: Brain Lifecycle         │
                  │ - Brain.ts: Manage state         │
                  │ - Idle Detection -> Trigger Sleep│
                  │   - SQL: Decay/Prune/Replay      │
                  └──────────────────────────────────┘
```

## 📚 Core Concepts

### 🔗 Nodes & Edges

- **Node**: A concept, entity, or knowledge point
- **Edge**: Semantic relationship between concepts
- **Weight**: Connection strength (0.1 - 5.0)
- **Activation**: Current energy level of a node

### 🧠 Learning Mechanisms

1. 💪 **Hebbian Learning**: Connected active nodes strengthen their bond
2. 📉 **Decay**: Unused connections weaken over time
3. 🌙 **Consolidation**: Sleep phase reinforces important memories
4. ⚡ **Stimulation**: External input activates nodes and spreads

### 🔄 State Machine

The Brain operates in states:

- 🌱 **FRESH**: Ready to learn
- 🧠 **LEARNING**: Processing new information
- 😴 **TIRED**: Needs consolidation
- 🌙 **SLEEPING**: Memory consolidation in progress

---

## 🛠️ Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Core Tests

Verify the core memory engine:

```bash
pnpm --filter polywise test
```

### 3. Run

Polywise runs as an Electron application. You need to start both the frontend and the desktop process:

```bash
# In one terminal, start the React frontend
pnpm --filter app dev

# In another terminal, start the Electron shell
pnpm --filter desktop dev
```

### 4. Build

To package the application for your platform:

```bash
# Build for macOS
pnpm build:mac

# Build for Windows
pnpm build:win
```

---

## 💭 Philosophy

Polywise is built on the belief that **truly intelligent AI needs truly intelligent memory**. Not just storage, but a system that forms connections organically, strengthens with use, forgets strategically, and evolves continuously.

---

## 📄 References

This project is inspired by the following research papers:

- [Long-lasting potentiation of synaptic transmission (1973)](<.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Credits

Polywise is built on the shoulders of these amazing projects:

### Libraries & Tools

- 🐘 **[PGlite](https://github.com/electric-sql/pglite)** - Wasm-based PostgreSQL for local-first apps
- ⚛️ **[React](https://react.dev/)** - Frontend UI library
- 🖥️ **[Electron](https://www.electronjs.org/)** - Desktop application framework
- 🔗 **[tRPC](https://trpc.io/)** - End-to-end typesafe APIs
- 📦 **[MobX](https://mobx.js.org/)** - Simple, scalable state management
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- 🚀 **[Hono](https://hono.dev/)** - Ultrafast web framework
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Next-generation build tool based on Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Library build tool powered by Rsbuild
- 🤗 **[Transformers.js](https://huggingface.co/docs/transformers.js/)** - State-of-the-art Machine Learning for the web
- ⚡ **[ONNX Runtime](https://onnxruntime.ai/)** - High-performance machine learning inferencing engine

### Models

- 🤖 **[Qwen3-Embedding](https://huggingface.co/onnx-community/Qwen3-Embedding-0.6B-ONNX)** - **Vector Encoding**: Converts text into high-dimensional vectors for semantic search and graph recall.
- 🎯 **[BGE Reranker v2-m3](https://huggingface.co/onnx-community/bge-reranker-v2-m3-ONNX)** - **Precision Sorting**: Reranks retrieved knowledge to ensure the most relevant results are prioritized.

## 📜 License

MIT - See [LICENSE](LICENSE) for details.
