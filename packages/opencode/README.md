# Opencode Polywise Plugin

[中文文档](./README_zh.md)

## Introduction

`@packages/opencode` is an official plugin for [OpenCode](https://opencode.ai) that integrates the **Polywise** knowledge engine. It provides project-level memory and context awareness for your AI coding assistant.

By leveraging Polywise's vector database and knowledge graph capabilities, this plugin automatically:

1.    **Retrieves Context**: Injects relevant project knowledge (documents, code snippets, decisions) into the AI's prompt based on your current query.
2.    **Saves Memory**: Automatically persists the AI's responses and insights into a project-specific knowledge base for future recall.

This ensures that your AI assistant "remembers" architectural decisions, code patterns, and project-specific rules across different sessions.

## Features

- **Project Isolation**: Data is stored locally in `.polywise/` within your project directory. Each project has its own isolated memory, tagged with a unique Project ID.
- **Automatic Retrieval (RAG)**: Before the AI answers, the plugin queries Polywise for relevant context and appends it to the system prompt.
- **Automatic Persistence**: After each conversation turn, the AI's output is saved to the knowledge graph, building a long-term memory of the project's evolution.
- **Metadata Support**: Captures and stores metadata such as file links, message roles, and timestamps.

## Installation

To use this plugin with OpenCode:

1.    **Install the package**:
      Ensure `@packages/opencode` is built and available in your workspace or installed in your project.

2.    **Configure OpenCode**:
      Add the plugin to your `opencode.json` (project-level) or `~/.config/opencode/opencode.json` (global-level).

      ```json
      {
      	"plugins": ["@packages/opencode"]
      }
      ```

      _Note: Adjust the package name path if you are linking it locally._

## Usage

Once installed, the plugin works automatically in the background.

1.    **Just Chat**: When you ask a question in OpenCode, you might see a "Project Memory" section injected into the prompt context if relevant information is found.
2.    **Memory Growth**: As you interact more with the AI, the local database (`.polywise/`) grows, making future answers more accurate and context-aware.
