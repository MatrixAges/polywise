---
name: chrome-cdp
description: Interacts with local browser via Chrome DevTools Protocol (only triggered after user explicitly requests to inspect, debug, or interact with pages open in Chrome)
---

# Chrome CDP

Lightweight Chrome DevTools Protocol CLI. Direct connection via WebSocket, no Puppeteer required, supports 100+ tabs, instant connection.

## Prerequisites

- Chrome (or Chromium, Brave, Edge, Vivaldi) with remote debugging enabled: open `chrome://inspect/#remote-debugging` and turn on the switch
- Node.js 22+ (uses built-in WebSocket)
- If the browser's `DevToolsActivePort` is in a non-standard location, set `CDP_PORT_FILE` to its full path

## Commands

All commands use `scripts/cdp.mjs`. `<target>` is the unique targetId prefix from `list` output; copy the full prefix shown (e.g., `6BE827FA`). CLI rejects ambiguous prefixes.

### List Open Pages

```bash
scripts/cdp.mjs list
```

### Screenshot

```bash
scripts/cdp.mjs shot <target> [file]    # Default: screenshot-<target>.png in runtime directory
```

Only captures the **viewport**. If content outside the viewport is needed, use `eval` to scroll first. Output includes page DPR and coordinate transformation hints (see **Coordinates** section below).

### Accessibility Tree Snapshot

```bash
scripts/cdp.mjs snap <target>
```

### Execute JavaScript

```bash
scripts/cdp.mjs eval <target> <expr>
```

> **Note:** Avoid using index-based selections (`querySelectorAll(...)[i]`) across multiple `eval` calls, as DOM may change between calls (e.g., after ignoring clicks, indices shift). Collect all data in one `eval` or use stable selectors.

### Other Commands

```bash
scripts/cdp.mjs html    <target> [selector]   # Full page or element HTML
scripts/cdp.mjs nav     <target> <url>         # Navigate and wait for load complete
scripts/cdp.mjs net     <target>               # Resource timing entries
scripts/cdp.mjs click   <target> <selector>    # Click element via CSS selector
scripts/cdp.mjs clickxy <target> <x> <y>       # Click at CSS pixel coordinates
scripts/cdp.mjs type    <target> <text>         # Type text at current focus; works in cross-origin iframes
scripts/cdp.mjs loadall <target> <selector> [ms]  # Repeatedly click "load more" until it disappears (default 1500ms interval)
scripts/cdp.mjs evalraw <target> <method> [json]  # Raw CDP command passthrough
scripts/cdp.mjs open    [url]                  # Open new tab (allows prompt per trigger)
scripts/cdp.mjs stop    [target>               # Stop daemon
```

## Coordinates

`shot` saves images at native resolution: image pixels = CSS pixels × DPR. CDP Input events (`clickxy` etc.) use **CSS pixels**.

```
CSS px = Screenshot pixels / DPR
```

`shot` prints DPR for the current page. Typical Retina (DPR=2): divide screenshot coordinates by 2.

## Tips

- Prefer `snap --compact` over `html` for viewing page structure.
- For typing text in cross-origin iframes, use `type` (not eval) — first focus with `click`/`clickxy`, then `type`.
- Chrome shows "Allow debugging" modal on first access to each tab. Background daemon keeps session alive, subsequent commands don't need re-approval. Daemon auto-exits after 20 minutes of inactivity.
