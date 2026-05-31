---
name: polywise-agent-rules
description: Use for any coding, code modification, refactor, or code review task in the Polywise repository when the work must follow the repository rules stored under `.agent/rules` and nearby `unify.md` or `agentmap.md` files.
---

# Polywise Agent Rules

1. Read `.agent/rules/global.md` before doing work in this repository.
2. For coding, refactor, code-generation, and review tasks, also read `.agent/rules/coding.md`.
3. Before creating files, refactoring modules, or writing core logic, read the relevant `unify.md` file for the target package and follow its matched sample paths.
4. If a package-level `agentmap.md` exists and the task changes that package's structure or responsibility boundaries, update that outline-level `agentmap.md` before finishing.
5. Treat `.agent/rules/` as the source of truth. Use this skill as the Codex-native bridge rather than copying those rules into unrelated files.
