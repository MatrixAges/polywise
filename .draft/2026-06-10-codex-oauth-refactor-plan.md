Codex OAuth refactor plan

1. Replace the old ai-sdk-provider-codex-app-server integration with a Codex OAuth runtime that uses the OpenAI Responses provider plus a custom fetch layer.
2. Read ChatGPT OAuth credentials from ~/.codex/auth.json, support token refresh through auth.openai.com, and avoid storing duplicated secrets in providers.json.
3. Sync the Codex provider as a normal Polywise custom provider with a dedicated runtime marker and a curated supported model list.
4. Update OAuth detection, sync status, and user-facing copy so Codex is described as ChatGPT Plus/Pro OAuth over API instead of native CLI runtime reuse.
5. Remove dead codexAppServer code paths and validate with TypeScript only.

Progress

- Added a new packages/polywise/src/utils/codexOauth helper folder for auth reading, refresh, request transformation, SSE conversion, and model curation.
- Switched Codex sync to a codex_oauth runtime backed by the OpenAI Responses provider and a custom fetch layer.
- Removed the old packages/polywise/src/utils/codexAppServer folder and the codex_native tool bypass.
- Updated renderer copy to describe the new Codex API-based OAuth flow.
- Fixed the non-streaming regression by forcing Codex backend requests onto stream mode while still converting non-streaming callers back to JSON responses.
- Replaced file-existence based Codex connection checks with a real OAuth probe request so expired or revoked auth is no longer shown as connected or synced.
- TypeScript validation passed after the migration.
