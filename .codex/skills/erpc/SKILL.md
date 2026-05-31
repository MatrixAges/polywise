---
name: erpc
description: Implement and maintain type-safe Electron IPC using eRPC and tRPC patterns in this project. Use when adding or changing main-process routers, preload bridges, renderer clients, or service boundaries that communicate across Electron processes.
---

# eRPC

Keep IPC type-safe and thin.

Main-process rules:

- Define routes in the shared router layer.
- Initialize IPC with `createIPCHandler` during app startup.
- Keep router handlers focused on validation and delegation.
- Move business logic into services instead of embedding it in routers.

Preload rules:

- Expose the bridge with `exposeElectronTRPC()`.
- Register it in the preload lifecycle, not ad hoc in renderer code.

Renderer rules:

- Use `ipcLink` and a typed client.
- Import the router type so renderer calls stay end-to-end typed.

Design constraints:

- Share complex payload types through the shared package, not by reaching into process-specific implementation modules.
- Add new routes by service responsibility, not by UI screen.
- Treat IPC boundaries as API boundaries: validate inputs and outputs deliberately.
