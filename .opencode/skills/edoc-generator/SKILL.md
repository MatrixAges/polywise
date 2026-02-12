---
name: edoc-generator
description: Specialized skill for translating documentation files and their content into English. Triggered when requested to localize, translate, or convert Chinese documentation to English.
---

# Skill: edoc-generator

This skill provides a structured workflow for translating project documentation from Chinese to English, ensuring consistency, technical accuracy, and professional terminology.

## Workflow

1.    **Preparation**:
      - Identify the target files or directories for translation.
      - Read the existing content to understand the context and technical terms.

2.    **Naming Convention**:
      - Translate the filename into a concise, professional English name.
      - Use `PascalCase` or `Sentence Case` for Markdown titles as per existing project style.
      - Ensure the new filename reflects the core topic accurately.

3.    **Content Translation**:
      - Translate the content accurately while preserving Markdown formatting, code blocks, and diagrams.
      - **Terminology**: Use standard industry terms (e.g., "Prefrontal Cortex" for "前额叶皮层", "Spreading Activation" for "激活扩散").
      - **Tone**: Maintain a professional, technical, and objective tone.
      - **Context**: If the document refers to specific code entities (classes, methods), ensure the names match the actual code.

4.    **Verification**:
      - Verify that all internal links (if any) are updated to point to the new English filenames.
      - Check that no information is lost during the translation process.

5.    **Cleanup**:
      - Replace the original Chinese files with the new English versions unless specifically asked to keep both.

## Implementation Rules

- **ALWAYS** translate the filename first to establish a reference.
- **NEVER** use literal translations for technical terms if an established English equivalent exists.
- **MUST** preserve all non-textual elements (Latex, Mermaid diagrams, code blocks).
- **SHOULD** ensure the translated content adheres to the `minimalist` approach if it contains code or technical instructions.
