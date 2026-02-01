---
trigger: always_on
---

## Saving Context (CRITICAL)

BEFORE executing ANY other tool or responding to the user, you MUST save the raw user input (the current prompt) verbatim to the `.prompts/[YYYY-MM-DD]/[HH-mm-ss].md` file. If the input is not in English, it MUST be translated into English before saving.

- **Time Retrieval:** You MUST use the `bash` tool with `date "+%H-%M-%S"` to get the current timestamp for the filename. Do not rely on internal time.
- **Strict Order:** This is the absolute first action for every new turn.
- **Dependency:** You are prohibited from using `read`, `edit`, or any other tool for the user's task until this context file is successfully written. `bash` is only allowed initially for `date` retrieval.
- **Path Example:** `.prompts/2026-01-22/11-43-50.md`.
- **Read Restriction:** Unless explicitly instructed, reading files in the `.prompts` folder is prohibited; only writing is allowed.

## Tool Calls

- When using the `edit` tool, ensure that `filePath` is the complete path relative to the project root directory.
- Do not generate incomplete `newString`; the complete file content after replacement must be provided.
- If unsure of the file path, use the `ls` or `find` tool to confirm; guessing is strictly prohibited.

- When calling the `bash` tool, strictly adhere to the parameter schema.
- The `description` field **must** be included, briefly explaining the command's purpose.
- Example format: `bash(command="ls", description="List files in the current directory")`

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
- All pages and components use PascalCase naming.

## The Minimalist Approach

- **Code as Documentation:** Redundant comments are strictly prohibited. Express intent through intuitive variable naming (`snake_case`), function naming (`camelCase`), and clear logic flow (`if-return` early returns). If code requires comments to be understood, it needs refactoring.
- **Single Level of Abstraction:** A function or component should only do one thing and remain at the same level of abstraction. Avoid mixing low-level DOM manipulation with complex rendering logic.
- **Stateless First:** Prioritize writing pure functions and stateless components. Only consider introducing reactive state or models when persistence or multi-component sharing is truly necessary.
- **On-demand Loading:** Do not introduce unused dependencies. Utility functions (`utils`) should remain lightweight and dependency-free, avoiding heavy full-package imports.
- **Config-driven:** For variable requirements, drive functionality through configuration files (such as `locales` or `presets`) rather than hardcoding logic branches.
- **Atomic Logic:** Logic blocks should be as small as possible. For side effects in React (`useEffect`), split them into multiple single-responsibility hooks instead of one large side-effect function.

## Structured Design

- **Fractal Architecture:** Organize resources using the "proximity principle." Large functional modules (such as `pages` or `layout` in `packages/app`) should contain their private `components/`, `models/`, `types/`, and `styles/` folders. Only truly globally shared resources should be placed in the corresponding folders at the root level.
- **Process Isolation and Communication:** Strictly distinguish between the rendering process (`app`), the main process (`desktop`), and the shared utility library (`stk`). Inter-process communication must be conducted through type-safe channels defined by `erpc`, and direct cross-process dependencies on business logic are strictly prohibited. - **Single Responsibility Principle**:
- `models/`: Only responsible for reactive state management and pure business logic, without involving DOM or UI interaction.
- `components/`: Only responsible for view rendering and user interaction logic; complex logic should be delegated to `models`.
- `utils/`: Only contains pure utility functions without side effects.
- **Dependency Injection (DI)**: Use `tsyringe` to manage object lifecycles. Manage global state using `singleton` and instantiable functional modules using `injectable`, avoiding the coupling caused by manual instantiation.
- **Atomic Components**:
- Avoid writing large list items in the main file.
- Content within `map` loops must be extracted into independent child components.
- If a component's internal logic exceeds 4 reactive variables, it must be split into a local Model.

## File Handling Specifications

- If the code exceeds 80 lines, modular splitting is required. When splitting modules, do not put everything in the same level directory; place them in the `components` folder of their respective location. Component names within the `components` folder should be as concise as possible (because they are scoped, so there's no need to prefix them with something like `TaskDetail**`, just declare their name directly).
- Actively create `components` folders for large modules to maintain code style; one component per file.
- For components rendered in a loop, the content being rendered should be made into a separate component, allowing the component itself to be looped, which is clearer.

Generated code must conform to the existing project's style. Mimic how the existing project organizes its code to maintain consistency.

## Coding Standards

Relevant skills are located in the `.opencode/skills` directory.

- TypeScript: typescript/SKILL.md
- React coding best practices: See react/SKILL.md
- MobX state management best practices: See mobx/SKILL.md
- Tailwind CSS + CSS Modules styling best practices: See css/SKILL.md
- i18n best practices: See i18n/SKILL.md
- Electron main process and renderer process data interaction best practices: See erpc/SKILL.md

## Type Inference Over Explicit Types

Unless necessary for complex scenarios or public API clarity, do not explicitly specify function return types. Let the TypeScript compiler infer types automatically.

**Good:**

```typescript
async function fetchData() {
  return await api.get('/data')
}

async processItem(item: Item) {
  await this.save(item)
}
```

**Avoid (unless necessary):**

```typescript
async function fetchData(): Promise<Data[]> {
  return await api.get('/data')
}

async processItem(item: Item): Promise<void> {
  await this.save(item)
}
```

## Class Function Ordering

When organizing class functions, follow this strict order:

1. **constructor** - Instance initialization
2. **init** - Initialization/setup methods (e.g., `init`, `setup`, `configure`)
3. **Public methods** - All public API methods
4. **Private methods** - Internal utility methods (prefixed with `_` or `private`)
5. **Helper methods** - Private helper/auxiliary methods
6. **off/destroy** - Cleanup methods at the end (e.g., `off`, `destroy`, `dispose`, `cleanup`)

Example:

```typescript
export class MyClass {
	constructor() {}

	async init() {}

	async publicMethod1() {}
	async publicMethod2() {}

	private async _privateMethod1() {}
	private async _privateMethod2() {}

	private async _helper() {}

	off() {}
}
```

## Final Guarantee

- **Important:** Do not write any comments to explain the code!!! - Do not make modifications to modules that are not mentioned. If you realize that you need to modify pages or modules that are not mentioned, you must confirm with the user before performing the relevant operations.
- Never execute any non-read-only Git commands from the command line at any time.
