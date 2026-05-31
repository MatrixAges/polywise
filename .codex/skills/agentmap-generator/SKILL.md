---
name: agentmap-generator
description: Maintain package-level `agentmap.md` files that summarize the real file tree and core responsibilities. Use when adding, removing, renaming, or significantly repurposing files in a package and the corresponding `agentmap.md` must be created or updated.
---

# Agentmap Generator

Update the package's `agentmap.md` whenever file layout or core responsibilities change.

Keep the map faithful to disk:

- Re-scan the actual package tree before editing the map.
- Do not invent files, folders, or responsibilities.
- Exclude transient or protected folders such as names starting with `__`.

Keep descriptions short:

- Describe packages by responsibility, not implementation detail.
- Describe files in one line with "what it owns" or "what it does".
- Prefer listing entry files and important leaves over exhaustively listing noise.

Keep the structure stable:

- Use a fenced `json` block for the tree.
- Preserve existing top-level sections when they are still valid.
- Update both the tree and the prose summary when responsibilities changed.

Before finishing, verify that every changed package with an `agentmap.md` still matches the current tree.
