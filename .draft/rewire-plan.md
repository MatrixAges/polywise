# Polywise Rewire Structural Plasticity Plan

Last Updated: 2026-05-21

## Objective

Implement a background `rewire` runtime under `packages/polywise/src/rewire/` that performs **structural plasticity**, not only weight tuning.

When the app is idle, the runtime should:

- replay recent high-quality usage signals
- grow sparse candidate edges between co-activated nodes
- stabilize a small subset of useful candidate edges
- prune weak or stale edges around overheated nodes
- keep frozen nodes and edges exempt from destructive cleanup

The design should be deterministic, bounded, and cheap enough to run continuously in the background without harming foreground latency.

## Current Baseline

### Existing Capabilities

- `node` already stores `active_level`, `active_sens`, `active_times`, `active_at`, and `is_frozen`
- `edge` already stores `weight`, `growth`, `confidence`, `bandwidth`, `active_times`, `active_at`, and `is_frozen`
- `callback/applyContentGraphFeedback.ts` already performs online reinforcement for accepted search results
- `callback/createContentSearchTrace.ts` already creates a strong query-centered usage signal
- `node_chunk` already links graph nodes to article chunks
- the app already has background runtime patterns in `cron/`, `im/`, and `rpc/linkcase/scheduler.ts`
- `env.active` already exposes a coarse global active/inactive signal

### Current Gaps

- there is no idle-time graph maintenance loop
- there is no persistent event stream for replaying recent co-activation
- there is no notion of `silent` vs `active` edges
- relation expansion currently treats every edge as equally recallable
- there is no homeostatic capacity control for hot or cold nodes
- there is no structural pruning rule beyond ordinary edge weakening

## Target Behavior

The runtime should approximate the following biological cycle:

1. **Dynamic sampling**
   Create low-confidence sparse candidate edges between nodes that repeatedly co-activate.
2. **Selective stabilization**
   Promote only repeatedly replayed candidate edges into normal active recall edges.
3. **Homeostatic rewiring**
   If a node becomes too hot, prune weak/stale edges first. If a node becomes too cold and under-connected, sample a few new candidate edges.
4. **Systems consolidation**
   During idle periods, replay recent usage ensembles and convert a subset of `silent` associations into `active` memory structure.

## Design Principles

### 1. Structural Changes Must Be Conservative

False positive topology changes are more dangerous than missed changes.

- creation budget per cycle must be low
- pruning must prefer weak, stale, non-frozen edges
- promotion from `silent` to `active` must require repeated evidence
- deletion should usually happen only after an edge has already decayed into a weak candidate state

### 2. Use High-Quality Signals First

The first implementation should prioritize usage evidence with clear semantics:

- accepted content callbacks
- query center node -> adopted article node activation
- repeated reuse of the same node neighborhoods

Do not start with noisy “every token seen by the model” logging.

### 3. Keep Foreground and Background Separated

Foreground logic should only emit compact signals and do cheap online reinforcement.
The expensive structural decisions belong to the idle-time rewire cycle.

### 4. Silent Edges Must Stay Silent

If we introduce “silent engrams”, they must not appear in ordinary `relationSearch` or normal graph expansion until they are stabilized.

### 5. Rewire Must Be Decentralized and Bounded

There should be no global graph optimization pass. Each cycle should operate on a bounded working set and use only local evidence:

- recent event groups
- current degree
- edge recency
- edge strength/confidence
- chunk/article co-membership
- one-hop and two-hop neighborhoods

## Biological Mapping to Product Semantics

| Biology concept             | Polywise mapping                                                                |
| --------------------------- | ------------------------------------------------------------------------------- |
| Dynamic dendritic sampling  | Create low-strength `silent` edges as candidate associations                    |
| Spine stabilization         | Promote a `silent` edge to `active` after repeated replay and enough confidence |
| Homeostatic plasticity      | Degree and activity budgets per node; hot nodes prune, cold nodes sample        |
| Silent engrams              | Edges stored in DB but excluded from normal recall until promotion              |
| Replay during consolidation | Idle-time reprocessing of recent rewire events                                  |

## Proposed Module Layout

```text
packages/polywise/src/rewire/
  index.ts
  initRewireRuntime.ts
  runtime.ts
  types.ts
  constants.ts
  shouldRun.ts
  status.ts
  recordEvent.ts
  runCycle.ts
  collectReplayGroups.ts
  sampleCandidates.ts
  stabilizeEdges.ts
  applyHomeostasis.ts
  decay.ts
```

Module responsibilities:

- `recordEvent.ts`: append compact usage signals
- `shouldRun.ts`: idle gating and concurrency guard
- `runCycle.ts`: one bounded rewire cycle
- `collectReplayGroups.ts`: read recent event groups and derive co-activation ensembles
- `sampleCandidates.ts`: create low-confidence `silent` edges
- `stabilizeEdges.ts`: promote repeatedly replayed edges
- `applyHomeostasis.ts`: prune weak/stale edges for hot nodes and sample for cold nodes
- `decay.ts`: gradual forgetting for untouched edges

## Data Model Changes

### 1. Extend `edge`

Add fields to persist structural-plasticity state:

- `state`: `'active' | 'silent'`
- `stability`: `real`, default `0`
- `rewire_score`: `real`, default `0`
- `last_rewire_at`: timestamp, nullable

Why:

- `state` is required so silent edges do not leak into normal recall
- `stability` stores how close the edge is to long-term retention
- `rewire_score` stores recent replay evidence
- `last_rewire_at` distinguishes background maintenance from foreground activation

### 2. Add `rewire_event`

Add a lightweight table for replayable usage groups.

Suggested fields:

- `id`
- `agent_id` nullable
- `session_id` nullable
- `stimulus_key` string
- `signal` string
- `role` string
- `node_id`
- `strength` real
- `created_at`

Recommended semantics:

- one foreground event group writes multiple rows with the same `stimulus_key`
- `role` examples: `center`, `accepted`, `rejected`, `neighbor`
- `signal` examples: `content_callback`, `relation_recall`, `manual_save`

This allows the background runtime to reconstruct co-activated ensembles without scanning raw conversation history.

### 3. Optional Runtime Status Store

Add `app.rewire_path`, for example `~/.polywise/rewire.json`, to store:

- `enabled`
- `last_cycle_at`
- `last_status`
- `last_summary`
- `last_error`
- `running`

This is not required for correctness, but it is useful for observability and debugging.

## Idle Gating

The rewire cycle should run only when all of the following hold:

- rewire is enabled in config
- `env.active === false`
- no session has `is_runing = true`
- no existing rewire cycle is in progress
- the idle grace window has elapsed since the last foreground activity

Recommended initial defaults:

- `tick_ms = 120000`
- `idle_grace_ms = 180000`
- `max_groups_per_cycle = 20`
- `max_edge_creations_per_cycle = 40`
- `max_edge_prunes_per_cycle = 40`

This is intentionally conservative.

## Signal Recording Strategy

### Phase 1 Signal Sources

The first implementation should record rewire events from:

- `callback/applyContentCallback.ts`
- `callback/applyContentGraphFeedback.ts`

For one accepted callback trace:

- record one `center` event for the query center node
- record one `accepted` event for each hit node resolved from the adopted articles
- optionally record `rejected` events for explicit misses only

Use a shared `stimulus_key`, such as `content_callback:<trace_id>`.

### Why Start Here

These signals already have strong semantics:

- they are tied to actual retrieval and adoption
- they already link to a center query node
- they already touch graph nodes and edges

That keeps the first version precise instead of noisy.

## Rewire Cycle

Each idle cycle should run in the following order.

### Step 1. Collect Replay Groups

Load recent `rewire_event` rows within a bounded time window, for example the last 24 hours, and group them by `stimulus_key`.

For each group, derive:

- center nodes
- accepted nodes
- rejected nodes
- aggregate replay strength
- recency score

Priority should favor:

- more recent groups
- groups with repeated acceptance evidence
- groups that touch non-frozen nodes

### Step 2. Replay and Strengthen Existing Structure

For each selected group:

- strengthen existing `active` edges between the center node and accepted nodes
- slightly increase `stability` and `rewire_score`
- update `active_times`, `active_at`, and `last_rewire_at`

This reuses the existing edge fields rather than inventing a separate strength system.

### Step 3. Dynamic Sampling of Silent Edges

For accepted node sets that repeatedly co-occur, create sparse `silent` edges when:

- the pair has no edge yet
- both nodes are not frozen
- both nodes are inside a bounded local neighborhood
- the pair has enough replay evidence

Candidate sources:

- nodes accepted under the same `stimulus_key`
- nodes linked to the same chunk/article neighborhood
- two-hop neighbors around repeatedly reused centers

New `silent` edges should start with:

- low `weight`
- low `confidence`
- low `bandwidth`
- `state = 'silent'`
- small positive `rewire_score`

### Step 4. Selective Stabilization

Promote a `silent` edge to `active` only when it crosses clear thresholds such as:

- `replay_count >= threshold`
- `rewire_score >= threshold`
- `confidence >= threshold`
- recent confirmations come from multiple cycles or distinct stimulus groups

Promotion should:

- set `state = 'active'`
- raise `bandwidth`
- raise `stability`
- keep the edge sparse; no fan-out explosion

This is the product equivalent of turning a silent engram into an active one.

### Step 5. Homeostatic Pruning

For touched nodes, compute a bounded heat score from:

- recent event count
- recent `active_times` growth
- current active degree
- ratio of stale weak edges

If a node is overheated:

- prune weak `silent` edges first
- if still above budget, downgrade or remove weak stale `active` edges
- never prune `is_frozen = true`

If a node is underactive and under-connected:

- allow a small candidate sampling budget
- only create `silent` edges, never immediate `active` edges

### Step 6. Decay and Forgetting

For untouched non-frozen edges:

- decay `rewire_score`
- slowly decay `confidence`, `bandwidth`, and `weight`
- if a `silent` edge remains weak and stale past a TTL, delete it
- if an `active` edge decays below the active threshold, downgrade it to `silent` before eventual deletion

This gives forgetting a slow diffusive shape rather than abrupt erasure.

## Recall Integration

Rewire only matters if recall behavior respects it.

### Required Recall Changes

Update `io/search/recall/collectRelated.ts` and `db/prepare.ts` so that:

- ordinary relation expansion only traverses `edge.state = 'active'`
- silent edges are excluded from normal `relationSearch`
- returned neighbors can be ranked by a combined score such as:
  `weight * confidence * bandwidth`

This is required to preserve the “silent engram” behavior.

## Interaction with Existing Callback Logic

The current callback path should remain the online fast path.

Recommended separation:

- `callback/applyContentGraphFeedback.ts`: immediate online reinforcement
- `rewire/recordEvent.ts`: append replayable usage evidence
- `rewire/runCycle.ts`: delayed structural changes

The callback system should not directly decide large-scale pruning or new topology fan-out.

## Config Surface

Add a minimal config block:

```ts
rewire?: {
  enabled: boolean
  tick_ms?: number
  idle_grace_ms?: number
  replay_window_ms?: number
  max_groups_per_cycle?: number
  max_edge_creations_per_cycle?: number
  max_edge_prunes_per_cycle?: number
  hot_node_degree_limit?: number
  cold_node_degree_limit?: number
}
```

Recommended default:

- disabled by default until verified
- conservative budgets only

## Execution Plan

### Phase 1. Schema and Runtime Skeleton

Files:

- `packages/polywise/src/rewire/*`
- `packages/polywise/src/db/schema/edge.ts`
- `packages/polywise/src/db/schema/index.ts`
- `packages/polywise/src/db/types.ts`
- new `packages/polywise/src/db/schema/rewire_event.ts`
- migration files under `packages/polywise/drizzle/`
- `packages/polywise/src/consts/app.ts`
- `packages/polywise/src/env.ts`

Deliverables:

- edge structural state fields
- `rewire_event` table
- `initRewireRuntime()`
- non-overlapping idle scheduler

### Phase 2. Foreground Signal Capture

Files:

- `packages/polywise/src/callback/applyContentCallback.ts`
- `packages/polywise/src/callback/applyContentGraphFeedback.ts`
- `packages/polywise/src/rewire/recordEvent.ts`

Deliverables:

- write event groups during accepted callback flows
- keep writes small and transaction-safe
- no behavior change to user-facing callback semantics

### Phase 3. First Rewire Cycle

Files:

- `packages/polywise/src/rewire/runCycle.ts`
- `packages/polywise/src/rewire/collectReplayGroups.ts`
- `packages/polywise/src/rewire/sampleCandidates.ts`
- `packages/polywise/src/rewire/stabilizeEdges.ts`
- `packages/polywise/src/rewire/applyHomeostasis.ts`
- `packages/polywise/src/rewire/decay.ts`

Deliverables:

- replay recent groups
- create `silent` edges conservatively
- promote repeated edges
- prune stale weak edges around hot nodes

### Phase 4. Recall Alignment

Files:

- `packages/polywise/src/db/prepare.ts`
- `packages/polywise/src/io/search/recall/collectRelated.ts`

Deliverables:

- silent edges excluded from normal expansion
- active neighbors ranked by structural strength

### Phase 5. Verification and Tuning

Deliverables:

- deterministic tests for event grouping, promotion, pruning, and decay
- migration validation
- bounded-cycle performance checks
- threshold tuning with a small synthetic graph fixture

## Test Plan

### Unit Tests

- `recordEvent` groups rows correctly by `stimulus_key`
- idle gate refuses to run while any session is active
- `silent` edges are not returned by normal relation expansion
- repeated replay promotes `silent -> active`
- weak stale `silent` edges are deleted
- `is_frozen` nodes and edges are never pruned

### Integration Tests

- accepted content callback produces both online reinforcement and rewire events
- after one idle cycle, repeated accepted node pairs create bounded `silent` edges
- after enough replays, promoted edges become visible to `relationSearch`
- overheated nodes lose weak stale edges before strong active edges

## Risks and Mitigations

### 1. Graph Pollution

Risk:
too many low-quality edges.

Mitigation:

- start with callback-only signals
- low creation budget
- `silent` first, `active` later

### 2. Recall Regression

Risk:
silent or low-quality edges pollute search expansion.

Mitigation:

- strict `state = 'active'` filter in recall
- ranking by structural score

### 3. Background Contention

Risk:
idle cycle competes with active sessions.

Mitigation:

- hard idle gate
- one cycle at a time
- bounded work budget

### 4. Catastrophic Forgetting

Risk:
pruning deletes valuable long-term structure.

Mitigation:

- prune weak stale silent edges first
- active edges downgrade before delete
- frozen edges are exempt

## Non-Goals for the First Pass

- no LLM inside the rewire cycle
- no global graph partitioning or community detection
- no per-token activation logging
- no immediate multi-agent-specific rewire policy
- no UI for manual edge editing in the first pass

## Acceptance Criteria

The first implementation is acceptable when:

- it runs only in idle background conditions
- it records replayable usage evidence from content callbacks
- it creates and maintains `silent` edges separately from `active` edges
- it promotes only repeated useful candidates
- it prunes weak stale edges conservatively
- relation expansion respects the silent/active distinction
- all changes are bounded, deterministic, and test-covered
