<p align="center">
<img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Polywise</p>

_<p align="center"><strong>Agentic memory engine for AI</strong></p>_

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

Polywise allows AI agents to remember and grow with every conversation, converting short-term interactions into long-term knowledge.

```typescript
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

#### 2. ⚡ **Fast React & Deep Think (STR/PFC)**

Polywise implements a dual-process system mimicking the Prefrontal Cortex (PFC) and Striatum (STR) for adaptive behavior:

```typescript
// 1. Subscribe to the Slow System (PFC) for refined decisions
poly.onAction(result => {
	console.log('PFC updated decision:', result)
})

// 2. Trigger a reaction (STR - Fast Path)
const response = await poly.react('Detected critical system failure')
// Returns instantly if a "habit" exists in memory
```

- **React**: Instant stimulus-response based on "muscle memory" (Habitual Edges).
- **Act**: Asynchronous deep reasoning that kicks in after a reaction to refine or correct the initial response.

#### 3. 🎯 **Context-Aware Retrieval**

Instead of simple vector similarity, Polywise uses **spreading activation** internally during queries to explore the semantic neighborhood of a concept.

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

Polywise manages its own lifecycle. Maintenance tasks like "sleep" consolidation run automatically when the system is idle and yield to foreground tasks.

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

Polywise is built on the belief that **truly intelligent AI needs truly intelligent memory**. Not just storage, but a system that forms connections organically, strengthens with use, forgets strategically, and evolves continuously.

---

## 📄 References

This project is inspired by the following research papers:

- [Long-lasting potentiation of synaptic transmission (1973)](<papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Credits

Polywise is built on top of [PGlite](https://github.com/electric-sql/pglite), [React](https://react.dev/), [Electron](https://www.electronjs.org/), [tRPC](https://trpc.io/), [MobX](https://mobx.js.org/), [Tailwind CSS](https://tailwindcss.com/), [Hono](https://hono.dev/), [Rsbuild](https://rsbuild.dev/), and [Rslib](https://rslib.dev/).

## 📜 License

Modified Apache 2.0 - See [LICENSE](LICENSE) for details.
