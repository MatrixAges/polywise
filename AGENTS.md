# Polywise Instructions

- Treat `.agent/rules/` as the authoritative repository instruction source.
- Read `.agent/rules/global.md` before starting work in this repository.
- For any coding, refactor, code-generation, or code-review task, also read `.agent/rules/coding.md`.
- Before creating files, refactoring modules, or writing core logic, read the relevant `unify.md` route file required by the target package and follow its matched sample paths.
- If a package-level `agentmap.md` exists and the task changes that package's file structure or responsibilities, update the corresponding `agentmap.md` before finishing.
- Do not assume `.agent/` is loaded automatically by Codex. This file exists to bridge those rules into Codex's supported project-instruction discovery flow.
