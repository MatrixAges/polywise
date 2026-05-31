# Polywise Tool Plan

Last Updated: 2026-05-31

## Goal

Add `polywise_tool` to `packages/polywise` so `global_panel_session` can call Polywise's own runtime surface safely.

## Decision

Use the local API map as the execution backend instead of shelling out to the `polywise` CLI.

Reasons:

1. The current CLI is already a thin wrapper over the same local API surface.
2. API routing already has progressive disclosure helpers, schema metadata, and stable typed targets.
3. Exposing CLI execution to the global panel session would broaden capability without adding meaningful surface beyond API calls.

## Implementation Steps

1. Add a new `createPolywiseTool` in `packages/polywise/src/fst/tools/polywise.ts`.
2. Reuse the existing API map helpers for `help`, `list`, `schema`, and `call`.
3. Wrap those API capabilities in a root help surface that explains the CLI-vs-API decision and directs the agent toward the API-first path.
4. Export `polywise_tool` from `packages/polywise/src/fst/tools/index.ts`.
5. Inject `polywise_tool` into the blocked-domain tool set used by `global_panel_session`.
6. Run Prettier on touched files and then run package type-check validation if available without using a build command.
