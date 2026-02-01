<p align="center">
<img src="packages/app/public/icon.svg" width="120" height="120" alt="Polywise Logo">
</p>

# <p align="center">Atom.css</p>

_<p align="center"><strong>🧠 A neuroscience-inspired knowledge graph and memory system</strong></p>_

<p align="center">
<a href="README.md">English</a> |
<a href="README.zh.md">简体中文</a>
</p>

## 💡 Why Build Polywise?

### 🤖 The Problem with Current AI Systems

Today's AI systems, despite their impressive capabilities, suffer from a fundamental limitation: **they lack true memory**. Each conversation starts fresh, each query exists in isolation, and the system cannot form persistent, evolving understanding from interactions over time.

This creates several critical issues:

1. 📚 **No Cumulative Learning** - AI doesn't remember what it learned from you yesterday
2. 🌐 **Context Fragmentation** - Knowledge exists in isolated sessions rather than interconnected networks
3. ⏸️ **Static Understanding** - The model's knowledge is frozen at training time, unable to adapt to new information dynamically
4. 🌫️ **Ephemeral Interactions** - Every conversation is a blank slate, wasting the potential of accumulated wisdom

### 🎯 Our Vision: A Brain for AI

Polywise was built to solve these problems by creating a **neuroscience-inspired memory system** that mimics how the human brain works:

- 🔗 **Associative Memory**: Knowledge stored as interconnected concepts (nodes) with weighted relationships (edges)
- ⚡ **Activation Spreading**: Stimulating one concept naturally flows to related concepts, just like human thought
- 💪 **Hebbian Learning**: Connections strengthen with use - "neurons that fire together, wire together"
- 🌙 **Memory Consolidation**: A sleep-like process that reinforces important memories and prunes noise
- 😴 **Fatigue & Recovery**: The system gets "tired" from intense learning and needs to "rest" to consolidate

### ✨ What Makes Polywise Different

Unlike traditional databases or vector stores, Polywise implements:

- 🕸️ **Dynamic Knowledge Graphs** - Concepts form organic networks that evolve
- 🌊 **Spreading Activation Theory** - Thoughts flow naturally from one concept to related concepts
- 🔄 **Bidirectional Learning** - Both reading (stimulation) and sleeping (consolidation) strengthen memory
- 🎯 **Contextual Retrieval** - Memory retrieval is context-sensitive and associative
- 📈 **Persistent Evolution** - The knowledge graph grows and adapts continuously

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
const poly = new Polywise(':memory:')

// Process knowledge from conversation
await poly.processArticle('User Preferences', 'User likes dark mode, prefers TypeScript, works late at night', [
	{ subject: 'User', predicate: 'prefers', object: 'Dark Mode', learning_rate: 2.0 },
	{ subject: 'User', predicate: 'likes', object: 'TypeScript', learning_rate: 2.5 }
])

// Later, the AI recalls related preferences
const related = await poly.getNodesByIdol('user_001')
// Automatically includes: Dark Mode, TypeScript, Late Night Work
```

#### 2. 📚 **Knowledge Accumulation**

Every interaction strengthens the knowledge graph:

- **Repeated concepts** form stronger connections
- **Related topics** cluster together organically
- **Important information** (high learning_rate) persists longer
- **Noise** naturally decays and gets pruned during "sleep"

#### 3. 🎯 **Context-Aware Retrieval**

Instead of simple vector similarity, Polywise uses **spreading activation**:

```typescript
// Stimulate a concept
await poly.stimulate(node_id, 5.0)

// Activation spreads through the network
await poly.tick() // Thoughts flow to connected concepts

// Retrieve activated context
const { nodes, edges } = await poly.getSnapshot()
// Returns not just the query, but semantically related concepts
```

#### 4. 🌙 **Memory Consolidation**

Like human sleep, Polywise has a consolidation phase:

```typescript
const brain = new Brain(poly)

// After intense learning
await brain.triggerInputBurst(100)

// During idle time, brain enters "sleep"
await brain.triggerSleepTick()
// Strengthens important memories, prunes weak connections
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
pnpm --filter polywise run test:memory

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
