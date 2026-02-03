---
name: agentmap-generator
description: Guides the generation, reading, and updating of agentmap.md files. This skill ensures a consistent and up-to-date map of the codebase for AI agents.
---

# Agentmap Generation and Maintenance

This skill governs the creation and lifecycle of `agentmap.md` files, which serve as the primary architectural guide for AI agents.

## 1. File Structure & Content

Every `agentmap.md` (at project root or `packages/{package_name}/`) MUST contain:

- **Architecture Overview**: High-level description of the project/package structure.
- **Module Summaries**: Brief descriptions of each functional module.
- **JSON File Tree**: A structured representation of the filesystem including:
     - **Folder/File Function**: What it does.
     - **Organizational Structure**: Patterns used (e.g., Layered, Hexagonal).
     - **Naming Conventions**: e.g., kebab-case for files, PascalCase for components.
     - **File Metadata**:
          - `input`: External dependencies or required data.
          - `output`: Provided exports or side effects.
          - `role`: Role in the system (e.g., Controller, View, Utility).
          - `description`: Brief functional summary.

## 2. Implementation Details

- Use Markdown code blocks for the JSON structure.
- Ensure descriptions are concise and accurate.
- Follow existing patterns in the `agentmap.md` if it already exists.
