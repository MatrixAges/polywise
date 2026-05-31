---
name: chrome-cdp
description: Inspect and control locally open Chrome-family browser tabs through Chrome DevTools Protocol using the bundled CLI. Use when the user explicitly wants to inspect, debug, navigate, snapshot, click, type, or screenshot pages already open in a local browser with remote debugging enabled.
---

# Chrome CDP

Use the bundled script at `scripts/cdp.mjs` for all browser interactions in this skill.

Start by confirming prerequisites:

- A Chrome-family browser is running with remote debugging enabled.
- Node.js is available.
- If tab discovery fails, check whether `DevToolsActivePort` is in a non-standard place.

Prefer this workflow:

1. Run `scripts/cdp.mjs list` to identify the target tab.
2. Use the target id prefix shown by `list`.
3. Choose the least invasive command that answers the request.

Common commands:

- `scripts/cdp.mjs list`
- `scripts/cdp.mjs snap <target>`
- `scripts/cdp.mjs shot <target> [file]`
- `scripts/cdp.mjs html <target> [selector]`
- `scripts/cdp.mjs eval <target> <expr>`
- `scripts/cdp.mjs nav <target> <url>`
- `scripts/cdp.mjs click <target> <selector>`
- `scripts/cdp.mjs clickxy <target> <x> <y>`
- `scripts/cdp.mjs type <target> <text>`

Use these guardrails:

- Prefer `snap` before `html` when structure is enough.
- Prefer one `eval` that gathers all required data over many fragile DOM index lookups.
- Remember screenshots are native pixels while input coordinates are CSS pixels.
- Focus first, then type, for iframe-heavy pages.

If the request needs authenticated tabs or the user's existing browser state, prefer this skill over generic browser automation.
