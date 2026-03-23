---
name: edoc-generator
description: Specialized for translating document files and their content into English. Triggered when localization, translation, or converting Chinese documents to English is requested.
---

# English Doc Generator

This skill is specialized for Chinese-English translation and conversion of documents in the project.

## 1. Translation Guidelines

- **Accuracy**: Must accurately convey the technical meaning of the original Chinese document.
- **Professional Terminology**: For technical terms (such as Agent, Prompt, Context, Dependency Injection, etc.), industry-standard English terms must be used.
- **Markdown Format**: After translation, the original Markdown format must be strictly maintained (including code blocks, bold, lists, links, etc.).

## 2. Execution Flow

1. **Read Original**: Read the user-specified Chinese `.md` document.
2. **Terminology Alignment**: Check if the document contains project-specific abbreviations or codes, and decide their English translation strategy.
3. **Paragraph-by-Paragraph Translation**: Convert content to English with appropriate localization polish.
4. **Overwrite or Save As**: Based on user's specific requirements, overwrite the original file with English content or save as a new file (e.g., `README_EN.md`).
