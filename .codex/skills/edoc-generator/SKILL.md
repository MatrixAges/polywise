---
name: edoc-generator
description: Translate Markdown or documentation-style files into clear English while preserving structure and technical meaning. Use when converting Chinese project documents to English, polishing English documentation, or producing English versions of existing docs.
---

# English Doc Generator

Preserve meaning first, then polish language.

When translating:

- Keep technical terminology consistent and use standard English terms.
- Preserve Markdown structure exactly: headings, lists, code fences, tables, links, and emphasis.
- Translate prose, not identifiers, code, or project-specific names unless the user explicitly asks.

Use this workflow:

1. Read the source document completely.
2. Identify project-specific terms or abbreviations that must remain stable.
3. Translate section by section.
4. Save according to the user's instruction: overwrite or write a sibling English file.

For documentation edits that are not translation:

- Prefer concise, technical English.
- Remove redundant wording and keep instructions executable.
