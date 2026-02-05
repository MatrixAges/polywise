<p align="center">
<img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Polywise</p>

<p align="center"><strong>Agentic Memory Engine. Build with AI, Build for AI</strong></p>

<p align="center">
English |
<a href="README.zh.md">简体中文</a>
</p>

## 💡 Why Polywise?

Current AI architectures are missing a critical component: **a hippocampus-like memory system**. While LLMs excel at pattern matching and text generation, they lack true, evolving memory. Each interaction is often isolated, meaning knowledge doesn't evolve—it's just stored.

Polywise changes this by implementing a **neuroscience-inspired memory engine** that serves as the "digital hippocampus" for modern AI:

- 🎭 **Episodic & Semantic Memory**: Remembers specific interactions and understands how concepts relate to each other.
- 🔗 **Associative Graph**: Knowledge is stored as interconnected concepts, not isolated bits.
- ⚡ **Spreading Activation**: One thought naturally triggers related ones through organic flow, enabling associative recall through connections rather than just vector similarity.
- 🌙 **Consolidation**: Like human sleep, it reinforces important memories and prunes noise through a structured lifecycle.
- 🔄 **Actionable Decisions**: Mimics the dual-process theory of the brain (Fast React/Slow Act) to provide adaptive behavior.

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

// Returns information, potential actions, and reranked metadata in a single pass
// Query also respects class-level filters automatically
const { knowledges, actions, metadata } = await poly.query({
	query: 'What are the user preferences?'
})
```

#### 2. ⚡ **Unified Retrieval (Fast & Slow)**

Polywise implements a unified retrieval system that returns both **Knowledges** (information) and **Actions** (behaviors), mimicking the brain's dual-process theory.

```typescript
// Returns information, actions, and merged metadata in a single pass
const { knowledges, actions, metadata } = await poly.query({
	query: 'What are the user preferences?'
})

// knowledges[0] -> "..." (String)
// actions[0]    -> "..." (String)
// metadata       -> { links: ["..."], files: ["..."], desc: "..." }
```

#### 2. ⚡ **Unified Retrieval (Fast & Slow)**

Polywise implements a unified retrieval system that returns both **Knowledges** (information) and **Actions** (behaviors), mimicking the brain's dual-process theory.

```typescript
// Returns information, actions, and merged metadata in a single pass
const { knowledges, actions, metadatas } = await poly.query({
	query: 'What are the user preferences?'
})

// knowledges[0] -> "..." (String)
// actions[0]    -> "..." (String)
// metadatas[0]  -> { links: ["..."], files: ["..."], desc: "..." }
```

#### 3. 🎯 **Habitual Reaction (The Fast Path)**

Mimicking "muscle memory," Polywise automatically learns habits where specific stimuli trigger instant actions. The system strengthens connections between stimuli and successful actions over time.

```typescript
// No manual definition needed!
// Habits are learned through interaction and reinforcement.
const { actions } = await poly.query({ query: 'Error in system!' })
// actions[0] will be 'Trigger emergency evacuation' if a strong habit has formed.
```

#### 4. 🔭 **Chain of Thought (The Slow Path)**

For complex queries, Polywise can explore its memory network iteratively, spreading activation to discover hidden connections.

```typescript
// Enable Chain of Thought (CoT) with cot_depth
const { knowledges, actions, cot } = await poly.query({
	query: 'How to optimize memory usage?',
	cot_depth: 2
})

// Subscribe to the thinking process
cot.on(event => {
	console.log(`Found ${event.knowledges.length} insights`)
	console.log(`Top Description: ${event.metadata.desc}`)
})
```

#### 5. 📜 **Long-Term Memory & Diary**

Polywise manages a high-priority Long-Term Memory (LTM) and a chronological Diary to solve the "recency bias" of neural networks. LTM stores distilled identities and rules, while the Diary provides time-based context.

- **Long-Term Memory**: Automatically distills proactive statements (identity, rules, constraints) and core concept patterns. It features a self-updating LRU mechanism to maintain limited capacity while retaining high-value associations.
- **Diary**: Automatically generates session summaries during the **SLEEPING** state. Entries are indexed by time, allowing the system to "remember" the flow of events across days.

```typescript
// Retrieve distilled long-term context
const ltm_text = await poly.getLongMemory()

// Query diary entries with navigation
const { current, prev, next } = await poly.getDailyMemory('2026-02-04 12:00:00')
```

---

## 🏗️ Architecture

```
polywise/
├── packages/
│   ├── polywise/          # Core memory engine
│   │   ├── src/
│   │   │   ├── Polywise.ts      # Database API
│   │   │   ├── Brain.ts         # Lifecycle manager
│   │   │   ├── sql/             # SQL operations
│   │   │   ├── types/           # Type definitions
│   │   │   └── utils/           # Utilities
│   │   └── test/              # Tests
│   ├── app/               # React frontend
│   ├── desktop/           # Electron shell
│   ├── erpc/              # IPC layer
│   └── stk/               # Shared toolkit
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
5. 🔄 **Habituation**: Successful "Act" decisions can be automated into "React" habits

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

- [Long-lasting potentiation of synaptic transmission (1973)](<papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Credits

Polywise is built on the shoulders of these amazing projects:

- 🐘 **[PGlite](https://github.com/electric-sql/pglite)** - Wasm-based PostgreSQL for local-first apps
- ⚛️ **[React](https://react.dev/)** - Frontend UI library
- 🖥️ **[Electron](https://www.electronjs.org/)** - Desktop application framework
- 🔗 **[tRPC](https://trpc.io/)** - End-to-end typesafe APIs
- 📦 **[MobX](https://mobx.js.org/)** - Simple, scalable state management
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- 🚀 **[Hono](https://hono.dev/)** - Ultrafast web framework
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Next-generation build tool based on Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Library build tool powered by Rsbuild

## 📜 License

Modified Apache 2.0 - See [LICENSE](LICENSE) for details.
