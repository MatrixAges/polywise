# Polywise Instructions

- Treat `.agent/rules/` as the authoritative repository instruction source.
- Read `.agent/rules/global.md` before starting work in this repository.
- For any coding, refactor, code-generation, or code-review task, also read `.agent/rules/coding.md`.
- Prefer direct inspection of the relevant code first. Do not treat `agentmap.md` as a mandatory first step for ordinary edits when the target files, nearby patterns, and package context are already clear.
- Read the relevant `agentmap.md` on demand when it helps confirm structure or style, especially before creating new files/modules, changing package structure, refactoring responsibility boundaries, or when the right sample path is not obvious from nearby code.
- If a package-level `agentmap.md` exists and the task changes that package's file structure, responsibility boundaries, or style-routing scopes/samples, update the corresponding `agentmap.md` before finishing.
- Do not assume `.agent/` is loaded automatically by Codex. This file exists to bridge those rules into Codex's supported project-instruction discovery flow.
