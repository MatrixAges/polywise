---
name: erpc-communication
description: Guides the implementation of Inter-Process Communication (IPC) using eRPC (electron-tRPC) between Electron's main and renderer processes. Triggered when working on Electron IPC, main-renderer communication, or tRPC-based Electron systems.
---

# eRPC Communication Skill

This skill provides mandatory instructions for implementing type-safe IPC using eRPC in this project.

## 1. Main Process Implementation

- **Router Definition**: You MUST define tRPC routers using the project's router utility.
- **Handler Initialization**: You MUST use `createIPCHandler` from `erpc/main` to bind the router to Electron windows.
- **Context Injection**: You SHOULD provide necessary instances (like `BrowserWindow` or `Tray`) via `createContext`.

```typescript
// ALWAYS initialize createIPCHandler in the app ready lifecycle
import { createIPCHandler } from 'erpc/main'

import { routers } from './rpcs'

createIPCHandler({
	createContext: async () => ({ win: mainWindow, tray: appTray }),
	router: routers,
	windows: [mainWindow]
})
```

## 2. Preload Script Configuration

- **Expose Bridge**: You MUST call `exposeElectronTRPC()` from `erpc/main` within the preload script.
- **Lifecycle**: It SHOULD be called within `process.once('loaded')`.

```typescript
import { exposeElectronTRPC } from 'erpc/main'

process.once('loaded', () => {
	exposeElectronTRPC()
})
```

## 3. Renderer Process Usage

- **Client Creation**: Use `ipcLink` from `erpc/renderer` to create the tRPC client.
- **Type Safety**: ALWAYS import the `Router` type from the main process to ensure full type safety.

```typescript
import { ipcLink } from 'erpc/renderer'

import { createTRPCClient } from '@trpc/client'

import type { Router } from '@desktop/rpcs'

export const trpc = createTRPCClient<Router>({
	links: [ipcLink()]
})
```

## 4. Implementation Examples (Few-Shot)

### Example 1: Basic Query (Action without input)

Used for simple actions like exiting the app or fetching static system info.

```typescript
// packages/desktop/src/rpcs/app/exit.ts
import { app } from 'electron'

import { p } from '@desktop/utils'

export default p.query(async () => {
	app.exit()
})
```

### Example 2: Mutation with Validation (Action with input)

Used for state-changing operations like setting themes or saving configuration.

```typescript
// packages/desktop/src/rpcs/app/setTheme.ts
import { nativeTheme } from 'electron'
import { enum as Enum, object } from 'zod'

import { p } from '@desktop/utils'

const input_type = object({
	theme: Enum(['light', 'dark', 'system'])
})

export default p.input(input_type).mutation(async ({ input }) => {
	const { theme } = input
	nativeTheme.themeSource = theme
})
```

### Example 3: Subscription (Event streaming)

Used for streaming window events, download progress, or system status updates.

```typescript
// packages/desktop/src/rpcs/app/onApp.ts
import { EventEmitter, on } from 'events'

import { p } from '@desktop/utils'

export default p.subscription(async function* (args) {
	const { ctx, signal } = args
	const e = new EventEmitter()

	const onFocus = () => e.emit('CHANGE', { type: 'blur', value: false })
	const onBlur = () => e.emit('CHANGE', { type: 'blur', value: true })

	try {
		ctx.win.on('focus', onFocus)
		ctx.win.on('blur', onBlur)

		for await (const [data] of on(e, 'CHANGE', { signal })) {
			yield data
		}
	} finally {
		ctx.win.off('focus', onFocus)
		ctx.win.off('blur', onBlur)
		e.removeAllListeners()
	}
})
```

## 5. Constraints & Best Practices

- **Channel**: DO NOT manually handle `erpc` channel messages; let the library manage IPC flow.
- **Window Management**: ALWAYS ensure new `BrowserWindow` instances are attached to the IPC handler if they need to communicate.
- **Type Imports**: Only use `import type` for the Router in the renderer process to avoid bundling main process code.
- **Validation**: ALWAYS use `zod` to define `input_type` for procedures that accept arguments.
- **Cleanup**: In `subscription`, ALWAYS implement a `finally` block to detach listeners and prevent memory leaks.
