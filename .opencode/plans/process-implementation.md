# Process Implementation Plan

This plan outlines the steps to add a `process` function to the `Polywise` instance, enabling event tracking and visualization of query execution.

## 1. Create `Process` Utility

**File:** `packages/polywise/src/Process.ts`

**Goal:** Implement a standalone class to manage event subscriptions and state accumulation.

**Key Features:**

- **Constructor:** Accepts the query string.
- **Properties:**
     - `hash`: Unique identifier generated from the query string (using simple hash + random ID).
     - `total`: Object storing all emitted events (`Record<string, any>`).
     - `callbacks`: Set of subscription functions.
- **Methods:**
     - `on(callback: (event: ProcessEvent, total: Record<string, any>) => void)`: Subscribe to updates. Returns `this` for chaining.
     - `emit(key: string, value: any)`: Trigger an update, store in `total`, and notify subscribers.
     - `off()`: Clear callbacks and reset state.

## 2. Update `Polywise` Class

**File:** `packages/polywise/src/Polywise.ts`

**Goal:** Integrate `Process` into the main class and emit events during execution.

**Changes:**

1.    **Import:** Import `Process` from `./Process`.
2.    **Property:** Add `public active_process: Process | null = null`.
3.    **Method:** Implement `process(query: string): Process`.
      - Instantiate `Process` with the query string.
      - Assign to `this.active_process`.
      - Call `this.query({ query })` asynchronously (without awaiting).
      - Return the `Process` instance immediately.
4.    **Emitting Events:** Add `this.active_process?.emit(...)` calls in `executeSingleSearch` and other critical methods:
      - `query_embedding`: After embedding generation.
      - `recall_result`: After memory recall.
      - `search_results`: After vector/fulltext search.
      - `memory_results`: After searching long-term memory.
      - `habits`: After habit retrieval.
      - `aggregated_results`: After result aggregation.
      - `reranked_knowledges`: After reranking knowledge.
      - `reranked_actions`: After reranking actions.

## 3. Update `Cortex` Class

**File:** `packages/polywise/src/Cortex.ts`

**Goal:** Emit high-level planning events using the shared `Process` instance.

**Changes:**

1.    **Usage:** Access the active process via `this.p.active_process`.
2.    **Emitting Events:** Add `this.p.active_process?.emit(...)` calls in:
      - `process`: Emit "start_cortex_processing".
      - `executeFastPath`: Emit "fast_path_execution".
      - `runPlanningLoop`: Emit "planning_step" events.

## 4. Verification

1.    **Run `pnpm test`** to ensure existing functionality remains intact.
2.    **Manual Test:** Create a simple script to verify the new `process` method:
      ```typescript
      const poly = new Polywise()
      await poly.init()
      poly.process('test query').on((event, total) => {
      	console.log(`Event: ${event.key}`, event.value)
      })
      ```
