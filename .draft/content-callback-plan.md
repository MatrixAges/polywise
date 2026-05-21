# Content Callback Implementation Plan

Last Updated: 2026-05-21

## Objective

Add a `callback` action to `content_tool` so the runtime model can close the loop after retrieval:

- a search query produces a `center node`
- the model may later decide which retrieved content items were actually adopted by the user
- adopted items strengthen article usage stats and graph connectivity
- non-adopted items may weaken the same query-to-node pathway, but only when the rejection signal is clear

This must be conservative. False positive callbacks are worse than missed callbacks.

## Current Baseline

### Existing Capabilities

- `packages/polywise/src/fst/tools/content.ts` already supports `save`, `fullTextSearch`, `semanticSearch`, `relationSearch`, and `hybirdSearch`
- `packages/polywise/src/db/schema/article.ts` already has `hit_count` and `hit_at`
- `packages/polywise/src/db/schema/node.ts` already has activation fields (`active_level`, `active_sens`, `active_times`, `active_at`)
- `packages/polywise/src/db/schema/edge.ts` already has synapse-like fields (`weight`, `growth`, `confidence`, `bandwidth`, `active_times`, `active_at`)
- article chunks are already linked to graph nodes through `node_chunk`

### Current Gaps

- `content_tool` does not persist retrieval traces for later callback
- there is no `callback` action
- there is no reusable graph-feedback service for article -> chunk -> node -> edge updates
- article `hit_count` / `hit_at` are not yet consumed by reranking

## Design Principles

### 1. Conservative Callback Policy

The model should call `callback` only when the user’s later message provides strong evidence that one or more retrieved items were actually adopted.

Strong evidence includes:

- the user explicitly selects one result
- the user quotes or paraphrases a unique detail that maps to one result
- the user asks a follow-up that clearly continues from one retrieved item rather than from the assistant’s own invention

Do not callback for:

- vague acknowledgements
- generic follow-up questions
- broad topic continuation without clear linkage to a retrieved item
- ambiguous cases where multiple retrieved items remain plausible

If uncertain, skip callback.

### 2. Hebbian-Inspired Learning, Not Literal Biology

The implementation should be explicitly “Hebbian-inspired”, not a claim of biological realism.

Operational mapping:

- `pre` activation: the `center node` generated from the search query
- `post` activation: a related node attached to an adopted article through `node_chunk`
- reinforcement occurs only when:
     - the query and adopted result belong to the same recent retrieval window
     - the user shows a strong adoption signal

This mirrors the key Hebbian constraint that simple co-occurrence is not enough; we need a tight temporal window plus an effective “postsynaptic firing” proxy.

### 3. Safe LTD for Misses

`miss_items` should not be populated mechanically.

Refinement:

- if the user clearly picks item `A` over `B/C`, then `A` can be a hit and `B/C` can be misses
- if the user only confirms `A` but does not clearly reject the rest, keep the rest neutral

In other words, “the remainder becomes miss” is allowed only when the adoption is exclusive and unambiguous.

### 4. No Silent Graph Pollution

The query node should be deduplicated and normalized. Reinforcement should happen only through callback, not merely because a search was executed.

The center node may be created during search, but edge strengthening must wait for callback.

## Proposed Runtime Flow

### Step 1. Search Produces a Traceable Retrieval Event

When `content_tool` runs a search action:

1. execute the existing search path
2. normalize the query into a `center node` label
3. create or reuse the center node
4. persist a session-scoped retrieval trace
5. return:
      - `trace_id`
      - `center_node_id`
      - ranked result list with stable article ids

The trace should contain at least:

- `trace_id`
- `session_id`
- `created_at`
- `action`
- `query`
- `normalized_query`
- `center_node_id`
- `article_ids` returned to the model
- optional score snapshot for debugging

### Step 2. Later Callback Applies Feedback

Add a new `content_tool(action="callback")` path with input roughly shaped as:

```ts
{
  action: 'callback'
  trace_id: string
  hit_items: string[]
  miss_items: string[]
  reason?: string
}
```

Rules:

- `trace_id` is required
- `hit_items` and `miss_items` must be subsets of the traced search result ids
- overlap between hits and misses is invalid
- expired traces are rejected
- duplicate callbacks for the same trace payload should be idempotent

The callback should run in a single DB transaction.

## Query Center Node Strategy

The “center node” is the query anchor for future relation learning.

### Normalization Rules

- trim whitespace
- collapse repeated spaces
- cap length
- for unusually long queries, fall back to a shorter semantic label derived from the search question or the first stable query segment

### Node Identity

- create/reuse a global node (`agent_id = null`)
- use the normalized query text as the node name
- insert a node vector embedding the same way existing node creation does

This keeps the query path searchable by both lexical and vector recall.

## Article / Node / Edge Feedback Semantics

### Article Updates

For each `hit_item` article:

- `hit_count = coalesce(hit_count, 0) + 1`
- `hit_at = now`

For miss items:

- do not decrement article counters
- leave article hit stats untouched

Rationale: article hit stats should mean “confirmed useful”, not “merely shown”.

### Node Updates

Resolve each hit article to related nodes through:

- `article`
- `chunk`
- `node_chunk`
- `node`

For each related node in a hit article:

- increment `active_times`
- set `active_at = now`
- slightly raise `active_level`
- slightly raise `active_sens`

For miss items:

- do not increase node hit counters
- optionally touch `active_at` only if needed for observability, but do not reinforce activation

### Edge Updates

Edges are between:

- `center_node_id`
- each related node attached to a hit or miss article

Relation name for these edges should be fixed and explicit, for example:

- `accepted_for_query`

If a hit edge does not exist, create it.

If a miss edge does not exist, do not create it.

## Hebbian Update Rule

Use a bounded Hebbian-style rule for hits:

```text
delta_w = eta * pre * post
```

Recommended operational mapping:

- `eta = base_learning_rate * edge.growth`
- `pre = 1.0` because the callback is explicitly about this center query
- `post = adoption_strength`

Initial practical version:

- `adoption_strength = 1.0` for clear hits
- optionally reduce to `0.7-0.9` later if we want rank-aware confidence

Hit update example:

- `weight += delta_w`
- `confidence += confidence_step`
- `bandwidth += bandwidth_step`
- `active_times += 1`
- `active_at = now`

Miss update example (LTD-like):

- `weight -= miss_factor * delta_w`
- `confidence -= small_penalty`
- `active_at = now`

All edge fields should be clamped to a safe range so repeated callbacks cannot explode or flip values:

- weight floor > 0
- confidence in `[0, 1]`
- bandwidth floor > 0

## Temporal Proximity Requirement

To respect the Hebbian constraint that timing matters, callback should only be valid within a recent window of the traced retrieval event.

Recommended first-pass rule:

- trace TTL: 30 minutes within the same session

This acts as our practical proxy for temporal coincidence.

## Rerank Integration

Updating `article.hit_count` / `hit_at` is not enough if retrieval never reads them back.

In the same implementation pass, extend article reranking so confirmed usefulness becomes a bounded secondary signal.

### Proposed Scoring Role

Keep relevance dominant. Feedback should be a secondary bias only.

Suggested final article score shape:

```text
final = relevance_score * A + recency_score * B + feedback_score * C
```

Where:

- `A` remains dominant
- `B` remains small
- `C` is smaller than `A`, and should not overpower semantic mismatch

### Feedback Score Inputs

- `hit_count`: frequency prior
- `hit_at`: freshness prior for confirmed usefulness

This makes callback meaningfully improve future ranking without turning retrieval into a popularity trap.

## Storage Plan

### Retrieval Trace Store

Add a session-scoped trace store under the session runtime area, for example:

- `sessions/<session_id>/content_callback.json`

This should track:

- active retrieval traces
- callback application ledger
- optional dedupe keys for idempotency

Why session-local storage:

- callback evidence is conversational and session-bound
- we do not need a new DB migration for trace bookkeeping
- this keeps validation strict without polluting the relational schema

### Idempotency

Store a deterministic callback key based on:

- `trace_id`
- sorted `hit_items`
- sorted `miss_items`

If the same callback is replayed, return success with `applied: false`.

## Implementation Plan by File

### 1. `packages/polywise/src/fst/tools/content.ts`

- add `callback` to the action enum
- update tool description with conservative-callback guidance
- on search actions:
     - create/reuse center node
     - persist retrieval trace
     - return `trace_id` and `center_node_id`
- on callback action:
     - validate trace and payload
     - call the graph-feedback service
     - return applied summary

### 2. New helper: `packages/polywise/src/fst/tools/contentCallbackStore.ts`

- write/read trace records
- enforce TTL
- enforce idempotency
- validate that callback ids belong to the stored result set

### 3. New helper: `packages/polywise/src/fst/tools/contentCallbackGraph.ts`

- resolve hit/miss articles to related nodes
- apply article updates
- apply node updates
- create/update/decay edges
- keep all updates inside one transaction

### 4. `packages/polywise/src/db/services/node.ts`

- add missing helpers such as:
     - `getNodes(...)`
     - `setNode(...)`

### 5. `packages/polywise/src/db/services/edge.ts`

- add missing helpers such as:
     - `getEdges(...)`
     - `setEdge(...)`

### 6. `packages/polywise/src/db/prepare.ts` or a new DB helper

Add reverse lookup support from article ids to related node ids, either through prepared SQL or a Drizzle join helper.

We need a reliable path for:

- article id -> chunk ids
- chunk ids -> node ids

### 7. `packages/polywise/src/io/search/rerank.ts`

- add bounded feedback weighting from `article.hit_count` and `article.hit_at`
- keep semantic relevance as the dominant factor

### 8. Optional cleanup: shared graph utility extraction

The codebase already has near-duplicate “ensure node / ensure edge” logic in post/linkcase utilities.

If the implementation starts repeating the same logic again, extract shared helpers instead of cloning a third copy.

## Validation Rules

The callback should no-op or reject when:

- the trace is missing
- the trace expired
- `hit_items` is empty and `miss_items` is empty
- an item is outside the traced result set
- the same item appears in both arrays
- the callback is duplicated

The model-facing tool description should explicitly say:

- only callback when adoption is strongly supported by later user messages
- otherwise skip

## Verification Plan

### Functional Tests

- search returns `trace_id`, `center_node_id`, and stable article ids
- callback with one clear hit increments `article.hit_count` and updates `hit_at`
- callback creates or strengthens `accepted_for_query` edges from center node to related nodes
- callback weakens only existing miss edges
- invalid callback payloads are rejected safely
- repeated callback payloads are idempotent

### Behavior Tests

- ambiguous follow-up should not require callback
- clear user selection should be callback-eligible
- rerank should improve previously confirmed items only when semantic relevance is still acceptable

### Regression Checks

- existing search actions still work without callback
- graph recall does not break when no callback is ever used
- center-node creation does not create duplicate query nodes for equivalent normalized queries

## Non-Goals for This Pass

- no fully automatic backend callback without an explicit model tool call
- no negative-edge schema
- no aggressive node/edge deletion or pruning
- no attempt to model full STDP or biologically realistic plasticity

## Key Execution Decisions

If approved, I will implement the first pass with these concrete decisions:

1. `callback` will require `trace_id` for safety.
2. Search will return `trace_id` and `center_node_id`.
3. Hit edges will use a fixed relation such as `accepted_for_query`.
4. Misses will weaken only existing edges and will not create new edges.
5. Remainder results will become `miss_items` only when the user’s adoption signal is clearly exclusive.
6. Article feedback will be integrated into reranking as a bounded secondary signal.
