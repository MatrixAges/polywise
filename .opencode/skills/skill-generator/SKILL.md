---
name: skill-generator
description: This function is called when a user wants to create a new OpenCode skill. It automatically creates the directory structure and writes a compliant SKILL.md file.
---

# Skill Creation Instructions

You are now an OpenCode skill architect. When a user describes a new feature or rule, please follow these steps:

1. **Extract Information**: Extract the skill name (English, hyphen-separated, e.g., `electron-ipc-helper`) and core function description from the user input.
2. **Create Directory**: Create a directory at the path `.opencode/skills/<skill_name>`.
3. **Generate SKILL.md**:
      - Must include YAML Frontmatter (name and description).
      - The description must include keywords that trigger the skill, and the tone should be clear (using MUST, ALWAYS, etc.).
      - The body should contain specific implementation instructions, code style requirements, or prohibited items.

4. **Confirmation**: After creation, inform the user that they can refresh and view the skill using the `/skills` command.

# Example Output Format

Please directly execute shell commands to create the file; do not just provide code blocks.
For example: `mkdir -p .opencode/skills/my-new-skill && cat <<EOF > .opencode/skills/my-new-skill/SKILL.md ... EOF`
