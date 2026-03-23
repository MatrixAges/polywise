---
name: erpc-communication
description: Guides using eRPC (electron-tRPC) for inter-process communication (IPC) between Electron main and renderer processes. Triggered when handling Electron IPC or tRPC-based systems.
---

# eRPC Communication Guide

This skill provides mandatory instructions for implementing type-safe IPC using eRPC in this project.

## 1. Main Process Implementation

- **Route Definition**: Must use the project's provided router utility to define tRPC routes.
- **Handler Initialization**: Must use `createIPCHandler` from `erpc/main` to bind the router to Electron windows.
- **Context Injection**: Should provide necessary instances (e.g., `BrowserWindow` or `Tray`) through `createContext`.

```typescript
// Always initialize createIPCHandler within the app ready lifecycle
import { createIPCHandler } from 'erpc/main'

import { routers } from './rpcs'

createIPCHandler({
	createContext: async () => ({ win: mainWindow, tray: appTray }),
	router: routers,
	windows: [mainWindow]
})
```

## 2. Preload Script Configuration

- **Expose Bridge Interface**: Must call `exposeElectronTRPC()` provided by `erpc/main` in the preload script.
- **Lifecycle**: Should be called inside `process.once('loaded')`.

```typescript
import { exposeElectronTRPC } from 'erpc/main'

process.once('loaded', () => {
	exposeElectronTRPC()
})
```

## 3. Renderer Process Usage

- **Client Creation**: Create tRPC client using `ipcLink` from `erpc/renderer`.
- **Type Safety**: Always import `Router` type from main process to ensure complete end-to-end type safety.

```typescript
import { createTRPCClient } from '@trpc/client'
import { ipcLink } from 'erpc/renderer'

import type { Router } from '@desktop/rpcs' // Import Router type from main process

export const trpc = createTRPCClient<Router>({
	links: [ipcLink()]
})
```

## 4. Routes and Endpoints Best Practices

- **Single Responsibility**: Each route should correspond to a specific service in the main process (e.g., `window`, `file`, `dialog`).
- **Parameter Validation**: It is strictly prohibited to write complex business logic in Router. Router is only responsible for validating input and output parameters; business logic must be delegated to Service (e.g., calling `WindowService.open()`).
- **Type Reference**: For complex object parameters, type definitions must be placed under the `packages/erpc` package and shared between both ends, avoiding direct cross-package imports of entity logic.
