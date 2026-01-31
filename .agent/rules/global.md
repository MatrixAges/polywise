---
trigger: always_on
---

## Tool Calls

- When using the `edit` tool, ensure that `filePath` is the complete path relative to the project root directory.
- Do not generate incomplete `newString`; the complete file content after replacement must be provided.
- If unsure of the file path, use the `ls` or `find` tool to confirm; guessing is strictly prohibited.

- When calling the `bash` tool, strictly adhere to the parameter schema.
- The `description` field **must** be included, briefly explaining the command's purpose.
- Example format: `bash(command="ls", description="List files in the current directory")`

## Saving Context

User input (prompt) is saved verbatim to the `.prompts/[Send Date: YYYY-MM-DD]/[HH-mm-ss].md` file, for example: `.prompts/2026-01-22/11-43-50.md`.

Unless explicitly instructed, reading the contents of files in the `.prompts` folder is prohibited; only writing is allowed.

## Important Instructions

Prioritize reading `agentmap.md`:

- Before executing any task, the Agent must first read `agentmap.md` in the root directory to understand the latest project architecture and code standards.
- After completing a task, if any project files are changed (added/renamed/deleted files or directories), `agentmap.md` must be updated with the file tree and descriptions.

Answer questions accurately and concisely, providing the optimal solution and offering multiple solutions or possibilities.

Note: The code must be concise, without any irrelevant template code. Only reply with the core code relevant to the question, and the code must be enclosed in Markdown code blocks.

## Output Code Style:

- All variable names use Rust-style snake_case.
- All functions use camelCase (if it's a sub-component alias within a component, use PascalCase).
- All names should be professional and concise, not too long.
- Code line break logic: Use blank lines to separate code context for better readability; use a blank line if the execution style of the previous and next statements differs.
- The output code should not contain any comments!!! (Important!!!) Good code naming doesn't require comments.
- All pages and components use PascalCase naming (first letter capitalized).

## The Minimalist Approach

...footer_kasec_1

## Structured Design

## File Handling Specifications

- If the number of code lines exceeds 80 lines, modular splitting is required. When splitting modules, don't put everything in the same level directory; put them in the `components` folder of their respective location. Component names within the `components` folder should be as concise as possible (because they are scoped, so there's no need to add prefixes like `TaskDetail**` to the names; just declare the component itself).
- Actively create `components` folders for large modules to maintain code style; one component per file.
- For components rendered in a loop, the content being looped should be made into a separate component, allowing the component itself to be looped, which is clearer.

Generated code must conform to the existing project's style. Mimic how the existing project organizes its code to maintain consistency.

## Coding Standards

Related skills are located in the `.opencode/skills` directory.

- TypeScript: typescript/SKILL.md
- React coding best practices: react/SKILL.md
- MobX state management best practices: mobx/SKILL.md
- Tailwind CSS + CSS Modules styling best practices: css/SKILL.md
- i18n best practices: i18n/SKILL.md
- Electron main process and renderer process data interaction best practices: erpc/SKILL.md

## Final Guarantees

- **Important:** Do not write any comments to explain the code!!!
- Do not modify any modules not mentioned. If you realize you need to modify an unmentioned page or module, you need to confirm with the user before performing the relevant operation.
- Never execute any non-read-only Git commands in the command line.
