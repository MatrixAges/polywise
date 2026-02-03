<p align="center">
<img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Polywise</p>

_<p align="center"><strong>🧠 A neuroscience-inspired knowledge graph and memory system</strong></p>_

<p align="center">
English |
<a href="README.zh.md">简体中文</a>
</p>

## 💡 Why Polywise?

Current AI systems lack **true memory**. Each interaction is isolated, meaning knowledge doesn't evolve—it's just stored. Polywise changes this by implementing a **neuroscience-inspired memory engine**:

- 🧠 **Cumulative Learning**: AI that remembers and grows with every conversation.
- 🔗 **Associative Graph**: Knowledge is stored as interconnected concepts, not isolated bits.
- 🌙 **Consolidation**: Like human sleep, it reinforces important memories and prunes noise.
- ⚡ **Activation Spreading**: One thought naturally triggers related ones through organic flow.

> We're not just building a database. We're building a **digital hippocampus** for AI.

---

## 🤝 Polywise & AI

### 🧩 The Missing Piece

Current AI architectures are missing a critical component: **a hippocampus-like memory system**. While LLMs excel at pattern matching and text generation, they lack:

- 🎭 **Episodic Memory** - Remembering specific interactions and events
- 🌐 **Semantic Networks** - Understanding how concepts relate to each other
- 🔄 **Consolidation Mechanisms** - Converting short-term interactions into long-term knowledge
- 🔍 **Associative Recall** - Retrieving information through connections rather than just similarity

### 🚀 How Polywise Enhances AI

#### 1. 🧠 **Long-Term Memory for AI Agents**

```typescript
// AI agent remembers previous interactions
const poly = new Polywise()
await poly.init({ data_dir: './my-memory' })

// Save knowledge from conversation
await poly.save({
	title: 'User Preferences',
	content: 'User likes dark mode, prefers TypeScript, works late at night',
	triples: [
		{ subject: 'User', predicate: 'prefers', object: 'Dark Mode', learning_rate: 2.0 },
		{ subject: 'User', predicate: 'likes', object: 'TypeScript', learning_rate: 2.5 }
	]
})

// Later, the AI queries related preferences
const { result } = await poly.query({ query: 'What does the user like?' })
// Automatically retrieves: Dark Mode, TypeScript, etc.
```

#### 2. 📚 **Knowledge Accumulation**

...

#### 3. 🎯 **Context-Aware Retrieval**

Instead of simple vector similarity, Polywise uses **spreading activation** internally during queries:

```typescript
// Query triggers internal activation spreading
const { result, cot } = await poly.query({
	query: 'How does the system handle memory?',
	recall_depth: 2,
	cot_depth: 1 // Enable Chain of Thought exploration
})

// result contains semantically related concepts and their source contexts
```

#### 4. 🌙 **Memory Consolidation**

Polywise manages its own lifecycle. Maintenance tasks like "sleep" consolidation run automatically when the system is idle and yield to foreground tasks:

```typescript
// No manual management needed.
// The internal Brain monitors activity and performs consolidation
// during idle periods to reinforce important memories.
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

### 🔄 State Machine

The Brain operates in states:

- 🌱 **FRESH**: Ready to learn
- 🧠 **LEARNING**: Processing new information
- 😴 **TIRED**: Needs consolidation
- 🌙 **SLEEPING**: Memory consolidation in progress

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Run tests
pnpm --filter polywise run test

# Start development
pnpm dev
```

## 💭 Philosophy

Polywise is built on the belief that **truly intelligent AI needs truly intelligent memory**. Not just storage, but a system that:

- Forms connections organically
- Strengthens with use
- Forgets strategically
- Dreams to consolidate
- Evolves continuously

We're not just building a database. We're building a **digital hippocampus**.

---

## 📄 References

This project is inspired by the following research papers:

- [Long-lasting potentiation of synaptic transmission (1973)](<papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>) - The foundation of Hebbian learning
- [The Organization of Behavior (1949)](<papers/The%20Organization%20of%20Behavior%20(1949).pdf>) - Donald Hebb's seminal work
- [A Spreading-Activation Theory of Semantic Processing (1975)](<papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>) - Collins & Loftus
- [Spreading Activation in Emotional Memory Networks (2016)](<papers/Spreading%20Activation%20in%20Emotional%20Memory%20Networks%20(2016).pdf>) - Modern activation theory

## 🙏 Credits

Polywise is built on top of these amazing technologies:

- 🗄️ [PGlite](https://github.com/electric-sql/pglite) - In-browser PostgreSQL
- ⚛️ [React](https://react.dev/) - UI framework
- 📱 [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- 🔄 [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- 🎯 [MobX](https://mobx.js.org/) - State management
- 🎨 [Tailwind CSS](https://tailwindcss.com/) - Styling
- 🌊 [Hono](https://hono.dev/) - Web framework
- 🏗️ [Rsbuild](https://rsbuild.dev/) & [Rslib](https://rslib.dev/) - Build tools

## 📜 License

Modified Apache 2.0 - See [LICENSE](LICENSE) for details.
