---
trigger: always_on
---

The answer should be in the same language as the input question. (CRITICAL)

## Saving Context (CRITICAL)

BEFORE executing ANY other tool or responding to the user, you MUST save the raw user input (the current prompt) verbatim to the `.prompts/[YYYY-MM-DD]/[HH-mm-ss].md` file. If the input is not in English, it MUST be translated into English before saving.

- **Time Retrieval:** You MUST use the `bash` tool with `date "+%H-%M-%S"` to get the current timestamp for the filename. Do not rely on internal time.
- **Strict Order:** This is the absolute first action for every new turn.
- **Dependency:** You are prohibited from using `read`, `edit`, or any other tool for the user's task until this context file is successfully written. `bash` is only allowed initially for `date` retrieval.
- **Path Example:** `.prompts/2026-01-22/11-43-50.md`.
- **Read Restriction:** Unless explicitly instructed, reading files in the `.prompts` folder is prohibited; only writing is allowed.

## Read Agentmap (CRITICAL)

After saving context, BEFORE reading any other files or executing tasks, you MUST read the relevant package's `agentmap.md` file.

- **Strict Order**: This is the SECOND action (after saving context) for every task involving file operations.
- **Dependency**: You are prohibited from using `read`, `edit`, or any other tool for file operations until the relevant package's `agentmap.md` has been successfully read.
- **Purpose**: Understand the latest package architecture and code standards.
- **Path**: `packages/{package_name}/agentmap.md` (relative to project root).

## Update Agentmap (CRITICAL)

After completing ANY task that changes project files (adds, renames, deletes files or directories) within a package, you MUST update that package's `agentmap.md` with the updated file tree and descriptions.

- **When**: After all file changes are complete.
- **What**: Update the JSON tree in section 2 of the relevant package's agentmap.md.
- **Dependency**: Do not consider the task complete until the package's agentmap.md is updated.

Answer questions accurately and concisely, providing the optimal solution and offering multiple solutions or possibilities.

Note: The code must be concise, without any irrelevant template code. Only reply with the core code relevant to the question, and the code must be enclosed in Markdown code blocks.

## Tool Calls

- When using the `edit` tool, ensure that `filePath` is the complete path relative to the project root directory.
- Do not generate incomplete `newString`; the complete file content after replacement must be provided.
- If unsure of the file path, use the `ls` or `find` tool to confirm; guessing is strictly prohibited.

- When calling the `bash` tool, strictly adhere to the parameter schema.
- The `description` field **must** be included, briefly explaining the command's purpose.
- Example format: `bash(command="ls", description="List files in the current directory")`

## Output Code Style:

- All variable names use Rust-style snake_case.
- All functions use camelCase (if it's a sub-component alias within a component, use PascalCase).
- **No Underscore Prefix**: Function names (including private and helper methods) MUST NOT start with an underscore (`_`).
- **Atomic Functions**: Functions should be kept concise. If a function's logic exceeds 40 lines, it MUST be split into smaller, atomic methods or extracted into utility functions.
- All names should be professional and concise, not too long.
- **Array Type Notation**: ALWAYS use `Array<T>` instead of `T[]` for array types.
- Code line break logic: Use blank lines to separate code context for better readability; use a blank line if the execution style of the previous and next statements differs.

## Code Spacing

Use blank lines to separate code with different execution styles or visual appearances. The fundamental principle: **if two consecutive statements look different in terms of execution style, add a blank line between them.**

### Visual Separation Principle

The blank line creates **visual grouping** that mirrors the logical grouping of code operations. Think of it as creating "paragraphs" in your code:

- **Setup paragraph**: Variable declarations and initial configuration.
- **Execution paragraph**: The actual work being done. **Consecutive statements with the same execution style (e.g., multiple synchronous calls like `this.a.off(); this.b.off();` or multiple asynchronous calls like `await this.exec(); await this.exec();`) MUST be grouped together without blank lines.** Add a blank line only when the execution style (async vs sync), functional responsibility, or visual pattern changes significantly.
- **Result paragraph**: Return statements, conditional logic, or state verification.

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
- **Dependency Injection (DI)**: Use `tsyringe` with `@abraham/reflection` to manage object lifecycles.
     - **Annotations**: Use `@singleton()` for global state (e.g., `GlobalModel`, `Settings`) and `@injectable()` for instantiable functional modules.
     - **Constructor Injection**: All dependencies must be injected through the class constructor. Avoid manual instantiation using `new`.
     - **Initialization (init)**: Each class should provide an `init()` method for logic that cannot be handled in the constructor (e.g., async setup, setting up observers). Parent classes are responsible for calling `init()` on their injected dependencies within their own `init()` method.
     - **Cleanup (off)**: Each class should provide an `off()` method to handle resource cleanup, such as removing event listeners or disposing of MobX observers.
- **Atomic Components**:
- Avoid writing large list items in the main file.
- Content within `map` loops must be extracted into independent child components.
- If a component's internal logic exceeds 4 reactive variables, it must be split into a local Model.

## File Handling Specifications

- If the code exceeds 80 lines, modular splitting is required. When splitting modules, do not put everything in the same level directory; place them in the `components` folder of their respective location. Component names within the `components` folder should be as concise as possible (because they are scoped, so there's no need to prefix them with something like `TaskDetail**`, just declare their name directly).
- Actively create `components` folders for large modules to maintain code style; one component per file.
- For components rendered in a loop, the content being rendered should be made into a separate component, allowing the component itself to be looped, which is clearer.

Generated code must conform to the existing project's style. Mimic how the existing project organizes its code to maintain consistency.
