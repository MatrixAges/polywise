# Opencode Polywise Plugin

[English Documentation](./README.zh.md)

## Introduction

`@polywise/opencode-plugin` The **Polywise** knowledge engine plugin for Opencode provides your AI programming assistant with project-level memory and context awareness.

Leveraging Polywise's vector database and knowledge graph capabilities, this plugin can automatically:

1. **Retrieve Context**: Inject relevant project knowledge (documents, code snippets, decisions) into the AI's prompts based on your current query.

2. **Save Memory**: Automatically persist the AI's answers and insights to a project-specific knowledge base for future retrieval.

This ensures your AI assistant can "remember" architectural decisions, code patterns, and project-specific rules across different sessions.

## Features

- **Project Isolation**: Data is stored in the `.polywise/` folder under the project directory. Each project has its own isolated memory, tagged with a unique project ID.

- **Automatic Retrieval (RAG):** Before the AI ​​answers, the plugin queries Polywise for relevant context and appends it to the system prompts.

- **Automatic Persistence:** After each round of dialogue, the AI's output is saved to a knowledge graph, building a long-term memory of the project's evolution.

- **Metadata Support:** Captures and stores metadata such as file links, message roles, and timestamps.

## Installation

To use this plugin in OpenCode:

1. **Installation Package:**

Ensure that `@polywise/opencode-plugin` is built and available in your workspace, or installed in your project.

2. **Configure OpenCode:**

Add the plugin to your `opencode.json` (project-level) or `~/.config/opencode/opencode.json` (global-level).

```json
{
	"plugins": ["@polywise/opencode-plugin"]
}
```

_Note: If you are linking it locally, please adjust the package name path._

## How to Use

After installation, the plugin will work automatically in the background.

1. **Normal Conversation**: When you ask a question in OpenCode, if relevant information is found, you may see the "Project Memory" section injected into the context of the prompt words.

2. **Memory Growth**: As you interact with the AI ​​more, the local database (`.polywise/`) will continuously grow, making future answers more accurate and context-aware.
