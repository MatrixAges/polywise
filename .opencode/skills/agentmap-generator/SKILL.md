---
name: agentmap-generator
description: Guides the generation, reading, and updating of agentmap.md files. This skill ensures a consistent and up-to-date codebase map for AI Agents.
---

# AgentMap Generation Guide

This skill provides mandatory specifications for maintaining `agentmap.md` in the project, enabling AI to accurately grasp the latest physical file structure and module functional division of the codebase.

## 1. When to Trigger Updates

- **After modifying any file**: As long as you have added, renamed, or deleted files within a package, or significantly changed the responsibilities of core modules, you **must** update the `agentmap.md` in that package's root directory before ending the task.

## 2. AgentMap Structure

A standard `agentmap.md` must contain the following sections:

### 2.1 Package Description

A brief description of the package's core responsibilities (e.g., "This is the frontend rendering process package for the application, responsible for all UI and state management").

### 2.2 Tree JSON Status Tree

This is the most important part and must be wrapped in a Markdown code block (``json). It represents the latest folder structure and core file responsibilities within the current package.

```json
{
	"src": {
		"components": {
			"Button": {
				"index.tsx": "Generic button component"
			}
		},
		"models": {
			"global.ts": "Global singleton state model"
		}
	}
}
```

## 3. Maintenance Specifications

- **Accuracy**: The JSON tree must truthfully reflect the current file structure on disk. Fabricating non-existent files is strictly prohibited.
- **Protected Directories**: Never include folders starting with `__` (double underscore) (e.g., `__codegrave__`) in `agentmap.md`.
- **Conciseness**: File descriptions should be as brief as possible (within one line), only needing to explain "what it does". For nested levels, if the directory is very complex internally, only list the core entry files.
