---
name: skill-generator
description: Create or update project-local Codex skills under `.codex/skills` using concise, triggerable SKILL.md files. Use when the user wants reusable project-specific skills added, refined, or migrated from other formats such as `.opencode`.
---

# Skill Generator

Create project-local skills under `.codex/skills/<skill-name>/SKILL.md`.

Prefer Codex-native skill structure:

- Keep YAML frontmatter limited to `name` and `description`.
- Put all trigger guidance into `description`.
- Keep the body concise and procedural.

When generating or migrating a skill:

1. Normalize the folder name to lowercase hyphen-case.
2. Rewrite the description so it states both what the skill does and when it should trigger.
3. Remove platform-specific metadata that Codex does not use.
4. Keep only non-obvious rules, workflows, scripts, references, or assets.

For migrations from `.opencode`:

- Convert agents into skills only if they are reusable instruction sets.
- Drop unsupported fields such as model temperature or OpenCode-specific tool declarations.
- Rephrase the body for Codex instead of copying large style guides verbatim.
