# CLI Input Schema Plan

Last Updated: 2026-05-31

## Goal

Improve Polywise CLI and `polywise_tool` usability around API parameter discovery.

## Changes

1. Add `polywise input_schema <rpc_path>` in `packages/polywise/src/cli/index.ts`.
2. Reuse the existing API map metadata instead of introducing a second schema source.
3. Return machine-friendly JSON including RPC path, method, path, parameters, examples, a CLI command skeleton, and a JSON payload template.
4. Update CLI help text so users and models can discover `input_schema` from root and leaf helps.
5. Strengthen `polywise_tool` descriptions and help hints so unknown targets should use `schema` before `call`.
6. Align `polywise_tool` action naming with the CLI by renaming `schema` to `input_schema` at the tool boundary while keeping the lower-level API helper unchanged.

## Validation

1. Run Prettier on touched files.
2. Run package TypeScript `--noEmit` validation.
