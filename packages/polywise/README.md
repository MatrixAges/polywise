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

- **Shadow Tick**: Randomly awaken weak connections during idle time to reinforce memory
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
│   ├── Pipeline.ts          # Model pipeline (embedding, reranking)
│   ├── Article.ts           # Article storage and search
│   └── sql/
│       ├── schema.ts        # Database schema definition
│       ├── Brain.ts         # Core SQL operations
│       └── Polywise.ts      # API layer SQL
├── test/                    # Test files
└── package.json
```

### Tech Stack

- **Storage**: [PGlite](https://github.com/electric-sql/pglite) - WebAssembly PostgreSQL
- **Testing**: [RSTest](https://github.com/web-infra-dev/rstest) - Rust-style testing framework
- **Build**: [Rslib](https://github.com/web-infra-dev/rslib) - High-performance bundler

### Core Modules

| Module     | Responsibility                                                                   |
| ---------- | -------------------------------------------------------------------------------- |
| `Polywise` | Database API entry: node/edge CRUD, activation propagation, knowledge injection  |
| `Brain`    | Lifecycle management: state machine, background task scheduling, fatigue control |
| `Pipeline` | Model inference: embedding generation and result reranking                       |
| `Article`  | Document storage: vector and full-text search capabilities                       |
| `sql/`     | All SQL queries, keeping business logic separate from storage                    |

## Use Cases

### 1. Save Content to Memory

Inject knowledge from articles:

```typescript
const poly = new Polywise()
await poly.init({ data_dir: './my-memory' })

await poly.save({
	content: 'Quantum computing exploits quantum mechanical phenomena...'
})
```

### 2. Query from Memory

Retrieve relevant information based on natural language:

```typescript
const { knowledges, metadata, cot } = await poly.query({
	query: 'How do qubits work?',
	recall_depth: 2,
	cot_depth: 1
})

console.log(knowledges) // Simplified knowledge strings
console.log(metadata) // Merged and reranked metadata (links, files, etc.)
```

## API Quick Reference

### Polywise

| Method                           | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `save(args: ProcessArticleArgs)` | Save content to memory                             |
| `query(args: QueryArgs)`         | Query relevant concepts and context from memory    |
| `init(args: PolywiseArgs)`       | Initialize the database and background brain       |
| `off()`                          | Gracefully shut down background tasks and close DB |

## Background Mechanism

Polywise runs an internal "Brain" that handles maintenance tasks like memory consolidation (Sleep Tick) and reinforcement (Shadow Tick) during idle time. These tasks automatically yield when `save` or `query` is called.

## Run Tests

```bash
pnpm --filter polywise run test
```

## License

MIT
