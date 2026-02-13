# FST (Full Self Thinking)

A self-executing, non-stop autonomous agent with structured finite context management.

## Core Philosophy

FST is designed to be a truly autonomous thinking agent. It breaks away from traditional stateless chat patterns by introducing a persistent, file-based thinking environment and a structured finite context state machine.

### 1. Finite Context State Machine

Context is not an infinite stream but a managed state. Using [mingo](https://github.com/kofrasa/mingo), FST maintains a structured "Smart Context" that can:

- **Undo/Redo**: Navigate through thinking states.
- **Selective Loading**: Dynamically load "Key Information" via references.
- **Summarization**: Automatically summarize referenced content to keep the active context within limits.

### 2. File-Based Persistence

FST operates directly on the filesystem, eliminating the need for complex databases:

- **Conversation Folders**: Every dialogue has its own dedicated directory.
- **Session-as-Files**: All session data and thinking states are persisted as structured files.
- **Information Exchange**: Uses files as the primary mechanism for state synchronization and information sharing.

### 3. Continuous Execution

Unlike reactive bots, FST is designed for non-stop operation. It leverages the [Polywise](@packages/polywise) reinforcement learning memory engine to:

- Maintain high information accuracy across long-running sessions.
- Prevent context explosion through intelligent memory consolidation.
- Execute self-driven tasks without constant user intervention.

## Architecture

FST integrates several high-performance modules to achieve its goals:

- **System Interaction**: [pi-mono](https://github.com/badlogic/pi-mono) for low-level system access and control.
- **Provider Management**: [Vercel AI SDK](https://sdk.vercel.ai/) for managing multiple LLM providers and sessions.
- **Context Engine**: [mingo](https://github.com/kofrasa/mingo) for structured object manipulation and state management.
- **Memory Engine**: [Polywise](@packages/polywise) for knowledge graph-based memory and RL-driven recall.

## Directory Structure

```
packages/fst/
├── src/
│   ├── FST.ts               # Core agent logic
│   ├── Context.ts           # Mingo-based context management
│   ├── Persistence.ts       # File-based storage logic
│   └── index.ts             # Entry point
├── test/                    # Functional and integration tests
├── agentmap.md              # Module architecture map
└── package.json
```

## Tech Stack

- **Platform**: Node.js / TypeScript
- **Context**: mingo
- **AI Core**: Vercel AI SDK
- **System**: pi-mono
- **Memory**: Polywise

## Use Cases

### Autonomous Research

FST can be assigned a topic, create a thinking folder, and continuously research by reading files, summarizing findings, and updating its internal memory.

### Self-Correcting Development

By persisting thinking states as a state machine, FST can backtrack when it hits a dead end in logic and try alternative paths, much like a human developer.

## License

MIT
