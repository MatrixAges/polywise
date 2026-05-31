---
name: agentmap-generator
description: Maintain package-level `agentmap.md` files as outline-level maps of the real file tree and core responsibilities. Use when package structure or responsibility boundaries change and the corresponding `agentmap.md` must be created or updated.
---

# Agentmap Generator

Update the package's `agentmap.md` whenever package structure or core responsibility boundaries change.

Keep the map faithful to disk:

- Re-scan the actual package tree before editing the map.
- Do not invent files, folders, or responsibilities.
- Exclude transient or protected folders such as names starting with `__`.

Keep the map at outline level:

- Prefer top-level folders and major business subdomains.
- Stop at 1-2 levels deep in most packages.
- Use a third level only for large, stable coordination roots such as runtime kernels or data layers.
- Do not enumerate routine leaf files, repeated component atoms, or generated outputs.

Keep descriptions short:

- Describe folders by responsibility, not implementation detail.
- Mention files only when they are entry points, public coordinators, or important infrastructure roots.
- Prefer a few stable ownership statements over exhaustive file-by-file noise.

Keep the structure stable:

- Use a fenced `json` block for the tree.
- Preserve existing top-level sections when they are still valid.
- Update both the tree and the prose summary when responsibilities changed.

Before finishing, verify that every changed package with an `agentmap.md` still matches the current outline on disk.
