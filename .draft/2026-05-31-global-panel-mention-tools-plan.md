# Global Panel Mention Tools Plan

Last Updated: 2026-05-31

## Goal

Restore `polywise_tool` in the frontend slash-menu tool list for `global_panel_session`.

## Root Cause

The Input slash menu does not read the runtime tool registry directly. It fetches `rpc.session.getMentionTools`, which currently uses a static configurable tool list and therefore misses blocked-session runtime extras such as `polywise_tool` and `page_tool`.

## Fix

1. Keep the existing configurable tool list behavior unchanged for normal sessions.
2. Append `polywise_tool` when the target session is `global_panel_session`.
3. Append `page_tool` only when `config.page_bridge_enabled === true`.
4. Preserve MCP and existing tool ordering.
5. Run Prettier on the touched file and validate with package TypeScript type-checking.
