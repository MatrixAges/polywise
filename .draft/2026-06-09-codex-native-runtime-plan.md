# Codex Native Runtime Plan

## Goal

Implement a Codex-native provider path that behaves closer to OpenClaw's Codex integration: selectable models after OAuth sync, native Codex turn execution, and bridged tool calling instead of text-only prompt flattening.

## Execution Plan

1. Re-read repository rules and the relevant package samples for `packages/polywise/src` and `packages/app/setting`.
2. Inspect the Codex app-server protocol surfaces needed for a native provider loop: model listing, thread/turn lifecycle, tool request flow, tool result flow, and approval handling.
3. Inspect current Polywise execution flow around `getModel`, `streamText`, and internal tools to determine the minimum adapter surface for Codex-native execution.
4. Replace the current Codex text-only shim with a native runtime adapter that:
      - starts a Codex app-server session,
      - creates a thread/turn,
      - streams assistant text,
      - intercepts tool request events,
      - executes mapped Polywise tools locally,
      - returns tool results back into the Codex turn loop,
      - completes with final assistant output.
5. Preserve a safe capability boundary: only expose the intended Polywise tools and keep destructive shell behavior blocked unless already allowed by Polywise.
6. Update OAuth sync so Codex models sync into a `codex_native` provider configuration with correct runtime metadata.
7. Verify with focused type-checking on the new Codex runtime path and a local execution probe.
8. Document remaining gaps if the full OpenClaw parity surface is larger than can be safely completed in one pass.
