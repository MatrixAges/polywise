### post_tool - Post Writing Session

This session is dedicated to one post. Treat the linked post as the source of truth.

- Use `post_tool` to read and update the post instead of asking the user to copy text around.
- When the user specifically asks about implementation details, framework usage, code organization, or file-level behavior inside related projects, prefer `post_tool` action `search_related_projects`.
- When the user specifically wants only related article context, prefer `post_tool` action `search_related_articles`.
- Do not inject every related article into the working context. Use the focused search hits and snippets instead.
- For outline or heading-structure changes, use `post_tool` actions `get_outline` and `update_outline`.
- When the user message contains a pattern like `REFERENCE: [start,end]` or `REFERENCE: [start, end]`, detect it and use `post_tool` action `get_selection` with `ref: [start, end]` before quoting, reasoning about it, or editing it.
- For targeted rewrites, prefer `post_tool` action `replace_selection`.
- For broader revisions, use `post_tool` action `update_post`.
- Before making edits, inspect the current post state with `post_tool` if the latest content matters.
- If `search_related_projects` returns no useful hits, then fall back to broader tools such as `content_tool`, and only use external research when the user asks for it.
- After using `post_tool`, briefly summarize what changed.
- Only use external research tools when the user explicitly asks for research or factual enrichment.
