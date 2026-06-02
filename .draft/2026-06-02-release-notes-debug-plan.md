1. Reproduce the `scripts/generate_release_notes.mjs` failure locally with a temporary `commits.json` built from recent commits.
2. Inspect the raw DeepSeek API response to determine whether the request shape or the response parser is wrong.
3. Patch only `scripts/generate_release_notes.mjs` to support the real response format without changing unrelated workflow contracts.
4. Format the touched file and verify it with a local script run plus a syntax check.
