---
name: erpc-communication
description: 指导使用 eRPC (electron-tRPC) 在 Electron 主进程和渲染进程之间实现进程间通信 (IPC)。在处理 Electron IPC 或基于 tRPC 的系统时触发。
---

# eRPC 通信指南

此技能提供了在本项目中使用 eRPC 实现类型安全的 IPC 的强制性说明。

## 1. 主进程实现

- **路由定义**: 必须使用项目提供的 router 工具定义 tRPC 路由。
- **处理程序初始化**: 必须使用 `erpc/main` 中的 `createIPCHandler` 将路由器绑定到 Electron 窗口。
- **上下文注入**: 应该通过 `createContext` 提供必要的实例（例如 `BrowserWindow` 或 `Tray`）。

```typescript
// 始终在 app ready 生命周期内初始化 createIPCHandler
import { createIPCHandler } from 'erpc/main'

import { routers } from './rpcs'

createIPCHandler({
	createContext: async () => ({ win: mainWindow, tray: appTray }),
	router: routers,
	windows: [mainWindow]
})
```

## 2. 预加载脚本 (Preload Script) 配置

- **暴露桥接接口**: 必须在预加载脚本中调用 `erpc/main` 提供的 `exposeElectronTRPC()`。
- **生命周期**: 应该在 `process.once('loaded')` 内调用。

```typescript
import { exposeElectronTRPC } from 'erpc/main'

process.once('loaded', () => {
	exposeElectronTRPC()
})
```

## 3. 渲染进程使用

- **客户端创建**: 使用 `erpc/renderer` 中的 `ipcLink` 创建 tRPC 客户端。
- **类型安全**: 始终从主进程导入 `Router` 类型以确保完整的端到端类型安全。

```typescript
import { createTRPCClient } from '@trpc/client'
import { ipcLink } from 'erpc/renderer'

import type { Router } from '@desktop/rpcs' // 导入主进程的 Router 类型

export const trpc = createTRPCClient<Router>({
	links: [ipcLink()]
})
```

## 4. 路由与端点最佳实践

- **单一责任**: 每个路由应该对应主进程中的一项具体服务（例如：`window`, `file`, `dialog`）。
- **参数验证**: 严禁在 Router 中编写复杂的业务逻辑。Router 只负责校验参数的输入与输出，必须将业务逻辑委托给 Service（例如调用 `WindowService.open()`）。
- **类型引用**: 对于复杂的对象传参，必须将其类型定义放在 `packages/erpc` 包下并在两端共享，避免直接跨包导入实体逻辑。
