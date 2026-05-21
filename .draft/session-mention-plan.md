# Session Mention Plan

Last Updated: 2026-05-21

## Objective

Add a session composer mention flow in `packages/app/components/Session/components/Input.tsx`:

- typing `/` after a whitespace boundary opens a skill picker
- typing `@` opens a session file picker
- both pickers filter as the user continues typing
- selected items are normalized into the outgoing message payload before `send()`

This should stay frontend-first and reuse existing RPC data where possible.

## Current Baseline

### Existing Pieces

- `Input.tsx` already owns the session textarea and submit flow
- `packages/app/components/Session/model.ts` already owns the session lifecycle and current `session_id`
- `rpc.skill.query.query()` already returns the global skill list
- `rpc.session.getFilesDir.query({ id })` already returns the session workspace root
- `rpc.file.list.query()` and `rpc.file.read.query()` already exist for file discovery and preview
- `packages/app/__shadcn__/components/ui/combobox.tsx` already provides a searchable popup pattern

### Current Gaps

- the textarea is uncontrolled, so trigger detection is not available today
- there is no mention state machine in `Session`
- file discovery is only tree-based, not flat-search based
- there is no send-time normalization for structured mention selections

## UX Contract

### Skill Mention

- trigger: `/` only when preceded by whitespace
- recommended compatibility rule: also allow start-of-line to behave like whitespace
- content: skill name search
- panel: searchable list of skills, showing name + description + path
- selection: adds a chosen skill to the composer as a structured mention

Recommended behavior:

- selected skills should not remain as raw `/query` text
- they should become a stable send-time hint block, not an ambiguous token

### File Mention

- trigger: `@` when preceded by start-of-line or whitespace
- content: search over session files after `@`
- panel: filtered file list from the current session workspace
- selection: inserts a file reference token into the textarea text

Recommended behavior:

- file mentions stay inline so the user can mix them with normal prose
- the UI should search on the text after `@` and keep filtering until commit

## Trigger Parsing Rules

Parse only the token that intersects the current cursor.

Suggested rules:

- `/` trigger is valid only when the previous character is whitespace or the cursor is at index `0`
- `@` trigger is valid only when the previous character is whitespace or the cursor is at index `0`
- the active query is the text from the trigger char until the next whitespace or newline
- once whitespace is inserted after an active mention, the panel closes
- when both `/` and `@` exist in the same line, prefer the nearest valid trigger before the cursor

This keeps the parser simple and avoids accidental activation inside URLs, emails, or normal code text.

## Data Flow

### 1. Composer State

Add local mention state to `Input.tsx`:

- `value`
- `cursor`
- `active_trigger`
- `active_query`
- `panel_open`
- `panel_items`
- `selected_skills`
- `selected_files`

The textarea should become controlled or semi-controlled so trigger parsing is deterministic.

### 2. Mention Source Loading

Extend the `Session` layer to provide mention sources:

- skill options from `rpc.skill.query.query()`
- session file candidates from the current workspace root

Preferred file source:

- add one backend query that returns a flattened file list for a session workspace
- if backend work is out of scope, recurse client-side with cached `rpc.file.list.query()` calls

Backend-first is the better default because it is faster, simpler to search, and easier to keep consistent.

Suggested RPC shape:

```ts
rpc.session.getMentionFiles.query({
  id: string
}) => {
  root: string
  files: Array<{
    path: string // session-relative path
    absolute_path: string
  }>
}
```

Recommended backend behavior:

- resolve the real session workspace root from the current session cwd
- walk recursively once per request
- return relative paths for search and insertion
- ignore obvious noise such as `.git`, `node_modules`, `.DS_Store`, and build output directories

### 3. Send-Time Normalization

Before `send(value)`, rewrite the composer state into a stable prompt payload:

- skill selections become a compact instruction block
- file mentions remain explicit relative-path references
- the raw trigger tokens are removed or normalized so the model sees clean text

This avoids coupling the model to UI-only syntax.

## Proposed Text Protocol

### Skills

Use a normalized header block, for example:

```text
[Selected Skills]
- skill-a
- skill-b

<user text>
```

### Files

Use inline references, for example:

```text
please check @src/foo.ts and @docs/bar.md
```

At send time, these should resolve to stable session-relative paths.

## Implementation Shape

### `packages/app/components/Session/components/Input.tsx`

Owns:

- textarea value and cursor tracking
- trigger detection for `/` and `@`
- popup anchor positioning
- active item index and arrow-key navigation
- commit behavior on Enter / click / keyboard navigation
- send-time normalization

### `packages/app/components/Session/model.ts`

Owns:

- loading mention source data for the current session
- exposing session workspace root / file candidates to the input
- refreshing mention sources when session id changes

### `packages/app/components/Session/types.ts`

Owns:

- mention source and selection types
- props added to `IPropsInput`

### Potential helper modules

- `mention.ts` for trigger parsing
- `mention-normalize.ts` for send-time rewriting
- `mention-search.ts` for file candidate filtering

## Execution Steps

1. Introduce controlled input state and trigger parsing in `Input.tsx`.
2. Add mention source types and model fields in `Session/types.ts` and `Session/model.ts`.
3. Add a reusable mention popup using the existing combobox primitives.
4. Load skill data and session file candidates from the session model.
5. Add filtering and keyboard navigation for both mention modes.
6. Implement mention commit:
      - skill commit removes the active `/query` token and stores the selected skill in structured state
      - file commit replaces `@query` with `@relative/path`
7. Normalize selected mentions into the outgoing text before `send()`.
8. Add tests for trigger detection, filtering, mention commit, and send-time rewriting.

## Acceptance Criteria

- typing ` /` after a space opens skill mention
- typing `@` opens session file mention
- both lists filter as the user types
- pressing `ArrowUp` / `ArrowDown` changes the active result
- pressing `Enter` commits the active mention instead of submitting the whole message while the panel is open
- selected items insert the right mention form
- send output is stable and readable for the runtime model

## Risks / Open Questions

- whether file discovery should be a new RPC or a client-side DFS
- whether skill selection should be represented as a block or as inline tokens
- whether the composer should preserve raw mention tokens in the final text

Recommendation:

- use a backend flat-file query
- use a skill block plus inline file references
- normalize away UI-only tokens before send
