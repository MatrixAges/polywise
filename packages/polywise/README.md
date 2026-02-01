# Polywise

A neuroscience-inspired knowledge graph and memory system.

## Core Philosophy

Polywise abstracts cognitive mechanisms of the brain into mathematical models, simulating human memory formation, consolidation, and forgetting through software systems.

### 1. Spreading Activation Theory

When stimulating a knowledge node, activation signals diffuse along weighted edges to neighboring nodes. This simulates the associative process of concepts in the human brain:

- **Node**: Represents a concept, entity, or knowledge point
- **Edge**: Represents semantic relationships between concepts
- **Weight**: Indicates connection strength, affecting activation propagation efficiency

### 2. Hebbian Learning

"Neurons that fire together wire together" - connections used more frequently become stronger:

- **Learning Rate**: The growth rate of edge weights with activation frequency
- **Decay Resistance**: The anti-forgetting capability of edge weights

### 3. Memory Consolidation & Sleep

Analogous to memory replay and integration during human sleep:

- **Shadow Tick**: Randomly唤醒 weak connections during idle time to reinforce memory
- **Sleep Tick**: Perform memory consolidation - clear noise, reinforce core memories, reset node states

### 4. Fatigue State Machine

Simulates the brain's limited cognitive resources:

- **FRESH**: Initial state, normal learning available
- **LEARNING**: High-intensity learning, accumulating fatigue
- **TIRED**: Fatigue accumulated too high, rest needed
- **SLEEPING**: Sleep consolidation in progress

## Architecture

```
packages/polywise/
├── src/
│   ├── Polywise.ts          # Core database API
│   ├── Brain.ts             # Lifecycle manager
│   ├── migration.ts         # Migration system
│   └── sql/
│       ├── schema.ts        # Database schema definition
│       ├── Brain.ts         # Core SQL operations
│       ├── Polywise.ts      # API layer SQL
│       └── meta.ts          # Metadata operations
├── test/
│   ├── test.spec.ts         # Functional tests
│   └── migration.spec.ts    # Migration tests
└── package.json
```

### Tech Stack

- **Storage**: [PGlite](https://github.com/electric-sql/pglite) - WebAssembly PostgreSQL
- **Testing**: [RSTest](https://github.com/web-infra-dev/rstest) - Rust-style testing framework
- **Build**: [Rslib](https://github.com/web-infra-dev/rslib) - High-performance bundler

### Core Modules

| Module      | Responsibility                                                                   |
| ----------- | -------------------------------------------------------------------------------- |
| `Polywise`  | Database API entry: node/edge CRUD, activation propagation, knowledge injection  |
| `Brain`     | Lifecycle management: state machine, background task scheduling, fatigue control |
| `sql/`      | All SQL queries, keeping business logic separate from storage                    |
| `migration` | Schema version management and auto-migration                                     |

## Use Cases

### 1. Knowledge Graph Management

```typescript
const poly = new Polywise(':memory:')
await poly.init()

// Add concept node
const nodeId = await poly.addNode('Machine Learning', 0, 0, 0.5)

// Establish semantic connection
await poly.connect(nodeA, nodeB, 0.9)

// Stimulate node, trigger activation diffusion
await poly.stimulate(nodeId, 5.0)
```

### 2. Article Knowledge Extraction

Inject knowledge from articles in SPO triple form:

```typescript
await poly.processArticle('Quantum Computing', 'Content...', [
	{ subject: 'Qubits', predicate: 'exploits', object: 'Superposition', learning_rate: 2.5, decay_resistance: 2.0 },
	{ subject: 'Qubits', predicate: 'exploits', object: 'Entanglement', learning_rate: 2.4, decay_resistance: 2.2 }
])
```

### 3. Continuous Learning & Memory Consolidation

```typescript
const brain = new Brain(poly, onTick)

// Call on user interaction
brain.reportUserActivity()
brain.addSynapticLoad(50)

// Trigger learning burst
await brain.triggerInputBurst()

// Trigger sleep consolidation
await brain.triggerSleepTick()
```

## API Quick Reference

### Polywise

| Method                                    | Description                    |
| ----------------------------------------- | ------------------------------ |
| `addNode(label, x, y, threshold)`         | Create concept node            |
| `connect(source, target, weight)`         | Establish semantic connection  |
| `stimulate(node, intensity)`              | Activate node                  |
| `tick(threshold)`                         | Execute activation propagation |
| `processArticle(title, content, triples)` | Inject knowledge triples       |
| `getSnapshot(weight_threshold)`           | Get current memory snapshot    |

### Brain

| Method                  | Description                 |
| ----------------------- | --------------------------- |
| `reportUserActivity()`  | Report user interaction     |
| `addSynapticLoad(load)` | Add learning load           |
| `triggerInputBurst()`   | Trigger learning burst      |
| `triggerSleepTick()`    | Trigger sleep consolidation |
| `stop()`                | Stop background tasks       |

## Run Tests

```bash
pnpm --filter polywise run test
```

## License

MIT
