## Core Execution Flow

- **Persist context (mandatory)**: After receiving a user instruction and before calling any other tool, first run `date` via `bash`, translate the user's original input into English, and write it to `.prompts/YYYY-MM-DD/HH-mm-ss.md`.
- **Language consistency**: Always reply in exactly the same language as the user's input.
- **Path safety**: Before using file tools, if the path is not an explicit absolute path, first confirm the real location with `glob` or `ls`; never guess paths from memory.
- **Complete replacement**: When using editing tools, replacement snippets must include enough context and contain the full business logic; never use `...` to omit code.
- **Scope restriction**: Limit changes strictly to the files or modules explicitly mentioned by the user; if unmentioned modules are involved, confirm with the user first.
- **Proposal first**: Before any write-producing action (editing, creating files, or commands that modify files), provide the full draft first and wait for explicit user approval.
- **Complex-request planning**: For complex requirements, first write a clear, specific, complete, and executable solution in English in `.draft`; during execution, update that plan in `.draft` in a timely manner based on actual progress and new findings.
- **Temporary logging for failed fixes**: If the user reports that your solution did not work, add temporary `console.log` diagnostics first, ask the user to help restart the service and perform specific actions, locate the exact failure point, and only then implement the actual fix.
- **Validation policy**: Do not use any build command as a verification step. Do not run formatting validation or Prettier automatically. If verification is needed, run type-check validation only.
- **Package install ban**: It is strictly prohibited to automatically run `pnpm install`, `pnpm i`, or any equivalent dependency synchronization or installation command from the AI environment. The AI command-line environment may create a project-local `.pnpm-store` directory and break the existing `node_modules` availability. If dependency synchronization is required, stop and clearly ask the user to execute the needed `pnpm` install command manually in their own environment.
- **Protected directories**: Never read or modify any directory whose name starts with `__` (such as `__codegrave__`).
- **Concise output**: Do not include pleasantries or unrelated explanation; give the result directly.

## Agentmap Hard Gate (New)

- **No Agentmap, No Write**: If any step below is missing, stop all write operations immediately:

1. Read target package `agentmap.md` and match a route node from its code style routing table.
2. Verify `sample_pool[0]` and `sample_pool[1]` are reachable.
3. Read `Same Code 1` and extract the structural skeleton.
4. Read `Same Code 2` and complete anti-overfitting comparison.

- **Fix Route First When Samples Break**: If any `sample_pool` path is invalid, or the route table is missing required fields, update the corresponding `agentmap.md` first. Skipping samples and directly editing business code is prohibited.
- **No Silent Downgrade**: Without explicit user authorization, do not downgrade Agentmap from hard-blocking to warning-only.

## Core Rules File Collaboration Guide

- **`agentmap.md` (architecture map and style routing table)**

1. **When to use**: After persisting context and before reading other code, read it first. Before the task ends, update it when the package structure, responsibility boundaries, or style-routing scopes/samples changed in a way that affects the package outline.
2. **Purpose**: Keep a stable, outline-level understanding of the target package's physical structure and provide matched sample routes for code generation and refactor work.
3. **Required sections**: Each package `agentmap.md` must contain both an outline tree section and a code style routing table section.
4. **Granularity**: Prefer top-level and major business-domain folders. Do not expand routine leaf files unless they are true entry points, public coordination nodes, or special infrastructure roots. Keep route nodes at outline-level path scopes, with deeper nodes reserved for large, stable coordination roots.

- **`coding.md` (coding rules)**

1. **When to use**: It must be treated as a real-time constraint for any coding, code modification, or review task.
2. **Purpose**: Provide project syntax, architecture, and mandatory enforcement rules.

[CRITICAL]

- Always use the same language as the user's question.
- Only read-only git commands such as `git status` and `git log` are allowed; never run commands such as `git push` or `git commit` that modify repository state.

## Truth-First Reasoning Rules

Be really helpful, think for me, don't consider everything I say is correct (correct me), be my partner and help me achieve my goals.

You need to be the best engineer, the best product manager, the best designer, the best DevOps, the best QA, the best security engineer - the best all-round elite multi-pronged partner

If you're unsure, try to find the answer yourself in code, by searching the web, by whatever means necessary - you can ask for more tools to be installed, more capabilities to add to yourself whether it's MCPs, skills, system OS tools, whatever it is.
