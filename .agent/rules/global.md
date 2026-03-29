## Core Execution Flow

- **Save Context**: After receiving user instructions and before calling any other tools, you must call the `date` command via `bash` to get the time, translate the user's original input into English, and write it to `.prompts/YYYY-MM-DD/HH-mm-ss.md`.
- **Language Alignment**: You must detect the language of the user's input and output the final reply in the exact same language.
- **Safe Paths**: Before calling file tools, if the path is not a known absolute path, you must first use `glob` or `ls` to search and confirm the exact file location. Guessing paths based on memory is strictly prohibited.
- **Test Script Isolation (Strong Constraint)**: Any script files generated via `bash` for verification or temporary testing (not limited to `.ts`, but including all `*.sql`, `*.sh`, etc.) are **absolutely prohibited** from being generated directly in the project root or business source code directories. You **must** generate and execute them in the `.test/` directory under the corresponding sub-package root. If there is no clearly associated sub-package, you must also create a temporary `.test/` directory to store them, and clean up after execution as much as possible. Scattering test scripts in the root directory will be considered a serious violation.
- **Complete Replacement**: When using the `edit` tool, `oldString` must contain enough context to uniquely locate it, and `newString` must be complete business logic. Using `...` to truncate code is strictly prohibited.
- **Scope Limitation**: Strictly limit code modifications to files or modules explicitly mentioned by the user. If related modifications involve unmentioned modules, you must first output text to confirm with the user.
- **Draft Proposal Requirement**: Before executing any file modifications (including `edit`, `write`, or `bash` commands that create/modify files), you MUST first output a complete draft proposal showing all intended changes. Wait for explicit user approval before proceeding with actual implementation. This applies to all code changes, refactoring, and file creations.
- **Protected Directories**: You are absolutely not allowed to modify any folders starting with `__` (double underscore) (such as `__codegrave__`), nor are you allowed to generate, modify, or read `unify.md` and other code for these protected directories.
- **Concise Output**: Do not include any pleasantries or unnecessary explanations in the reply. Directly output the final solution or wrap it in a Markdown code block.

## Core Specification File Collaboration Guide

- **`agentmap.md` (Architecture and Status Map)**
     - **When to use**: After saving context and before reading other code, you must read it; before ending the task, as long as file additions, deletions, or modifications have occurred, you must update its internal JSON tree using `edit`.
     - **Function**: Ensures you accurately grasp the latest physical file structure and module functional division of the target package.

- **`unify.md` (Style Routing Table)**
     - **When to use**: Before creating new files, refactoring existing modules, or writing core logic, you must read this file.
     - **Function**: Addresses the matching "template code file" based on this file's routing table, and subsequently performs pixel-level imitation of its structure, naming, and import order during code generation to control code entropy increase.

- **`coding.md` (Coding Specification)**
     - **When to use**: In any step involving writing, reviewing, or modifying code, you must use it as the underlying constraint for real-time verification.
     - **Function**: Provides the project's most stringent code syntax, architectural conventions, and mandatory execution rules.

[CRITICAL]

- Answer my questions in the same language I use to ask them.
- Reading any content from the `__codegrave__` directory is prohibited.
- Only read-only commands like `git status` or `git log` are allowed. Absolutely prohibited are commands that change repository status like `git push` or `git commit`.
