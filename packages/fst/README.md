# FST (Full Self Thinking)

A self-executing, autonomous agent framework designed for continuous thinking without context explosion.

## Core Philosophy

FST is built on the belief that agents should be truly autonomous and persistent. By utilizing a file-based information exchange mechanism and a finite context state machine, FST ensures that sessions remain manageable, accurate, and cost-effective over long periods.

## Key Technologies

- **[pi-mono](https://github.com/badlogic/pi-mono)**: Handles low-level system interaction and execution.
- **Vercel AI SDK**: Manages multi-provider connections and standardized dialogue sessions.
- **[mingo](https://github.com/kofrasa/mingo)**: Powers the structured "intelligent context" management through model outputs.
- **Polywise**: Integrates a Reinforcement Learning (RL) memory engine for high-fidelity information retrieval.

## Features

- **File-Based Persistence**: No database required. Each conversation is a dedicated folder; all sessions are persistent files.
- **Finite Context State Machine**: Mingo-driven structured context that supports undo/redo and persists to disk.
- **Reference-Based Loading**: Context stays lean by only loading "key information" via references (reading and summarizing on demand).
- **Memory Augmented**: Deep integration with Polywise's memory engine for accurate, non-accumulating context retrieval.
- **Autonomous Execution**: Designed for non-stop, self-driven task completion without context degradation.

## Availability Support

- **Intelligent Model Routing**: Dynamic dispatching using cheap models (e.g., Gemini Flash) or local models to optimize performance and cost.
- **Economic Safety**: Per-model and global cost caps based on token calculations to protect user budgets.
- **High Availability**: Automatic failure fallback ensures workflows continue even if a specific provider or model fails.

## Getting Started

```bash
pnpm install
```

## Architecture

FST manages "Intelligent Context" as a state machine. Instead of stacking infinite tokens, it selectively loads information into a finite window, ensuring the agent remains sharp and focused.
