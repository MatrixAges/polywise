# Implementation Plan - Add process() utility

The user requested an independent `process(query)` function that wraps the `Polywise.query()` promise to expose execution events (specifically Chain-of-Thought updates) without modifying the core `query` implementation significantly.

## Proposed Changes

### 1. Create `packages/polywise/src/utils/process.ts`

Implement the `process` function which:

- Accepts a `Promise<FinalQueryResult>` (the return of `poly.query()`).
- Returns a "Promise-like" proxy object that exposes an `.on(listener)` method.
- Internally waits for the promise to resolve, then attaches to the `cot` emitter present in `FinalQueryResult`.
- Emits events to listeners in the format `(event, total)`.

**File Content:**

```typescript
import type { FinalQueryResult } from '../types'

export type ProcessEvent<T = any> = { key: string; value: T }
export type ProcessListener = (event: ProcessEvent, total: Record<string, any>) => void

export default function process(promise: Promise<FinalQueryResult>) {
	const listeners = new Set<ProcessListener>()
	const total: Record<string, any> = {}

	promise.then(result => {
		if (result && result.cot && typeof result.cot.on === 'function') {
			result.cot.on((data: any) => {
				const key = 'cot'
				const event = { key, value: data }
				total[key] = data
				listeners.forEach(fn => fn(event, { ...total }))
			})
		}
	})

	const proxy = {
		on: (fn: ProcessListener) => {
			listeners.add(fn)
			return proxy
		},
		then: <TResult1 = FinalQueryResult, TResult2 = never>(
			onfulfilled?: ((value: FinalQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
			onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
		): Promise<TResult1 | TResult2> => {
			return promise.then(onfulfilled, onrejected)
		},
		catch: <TResult = never>(
			onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
		): Promise<FinalQueryResult | TResult> => {
			return promise.catch(onrejected)
		},
		finally: (onfinally?: (() => void) | null): Promise<FinalQueryResult> => {
			return promise.finally(onfinally)
		},
		[Symbol.toStringTag]: 'Promise'
	}

	return proxy
}
```

### 2. Export `process` utility

Update `packages/polywise/src/utils/index.ts` to export the new function.

**Append:**

```typescript
export { default as process } from './process'
```

### 3. Update Main Exports

Update `packages/polywise/src/index.ts` to export `process` so users can import it directly from the package.

**Append:**

```typescript
export { process } from './utils'
```

## Verification

1.    Create a test script or use existing tests to verify that `process(poly.query(...)).on(...)` receives events.
2.    Ensure existing `await poly.query(...)` usage remains unaffected (regression test).
