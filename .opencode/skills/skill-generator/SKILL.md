---
name: skill-generator
description: Called when users need to create new OpenCode skills. Automatically creates directory structure and writes SKILL.md files conforming to specifications.
---

# Skill Generator

This skill is used to extend new specialized skills for AI in the project, ensuring new skill files meet the project's format requirements.

## 1. Skill Structure

Each new skill must be placed in the `.opencode/skills/{skill-name}/` directory, and its main file must be named `SKILL.md`.

## 2. SKILL.md Format Requirements

YAML Frontmatter description must be included at the top of the file, containing the following two fields:

```yaml
---
name: { skill-name }
description: { A piece of English or Chinese text describing when and what the skill does }
---
```

## 3. Generation Guide

1. **Create Directory**: Create a new skill-named folder under `.opencode/skills/`.
2. **Write Content**: Use Markdown syntax to detail the following under the skill:
      - Core architecture/principles
      - Naming and code style specifications
      - Specific execution best practices
      - Mandatory red lines (what absolutely cannot be done)
3. **Language Alignment**: New skill content should尽量 use Chinese (to align with unified specifications), but the YAML header `name` must be English letters and hyphens.
