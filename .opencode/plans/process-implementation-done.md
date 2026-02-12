# Process Implementation

Implemented `Process` class and integrated it into `Polywise` using `AsyncLocalStorage` to support concurrent query tracking.

## Files Modified

- `packages/polywise/src/Process.ts`: Created `Process` class.
- `packages/polywise/src/Polywise.ts`:
     - Added `process_storage` (AsyncLocalStorage).
     - Added `process(query)` method.
     - Added `active_process` getter.
     - Emitted events in `executeSingleSearch`.
- `packages/polywise/src/Cortex.ts`: Emitted events in `process`, `executeFastPath`, `runPlanningLoop`.

## Key Features

- **Hash Generation**: Uses `node:crypto` SHA256 + random ID for unique process identification.
- **Concurrency**: Uses `AsyncLocalStorage` to ensure `this.active_process` returns the correct process instance for the current execution context, supporting multiple concurrent `process()` calls.
- **Event Tracking**: Accumulates all events in `total` object and emits them via `.on()` callback.

## Usage

```typescript
const poly = new Polywise()
// ... init ...

poly.process('how to fix bug').on((event, total) => {
	console.log(event.key, event.value)
})
```
