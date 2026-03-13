# 代码风格路由 (Unify Rules)

本文件定义 `desktop` (Electron 主进程) 的代码规范。

## Tree JSON 路由表

```json
{
	"Electron Service (系统服务)": {
		"description": "负责调用 Electron 原生 API（如窗口控制、文件系统对话框等）的服务层。",
		"fractal_rule": "单个类负责单一操作系统级别能力（如 `WindowService`, `FileService`）。如果底层封装繁杂，则必须新建同名文件夹收拢特定能力的模块实现，提供 `index.ts` 暴露服务实例。",
		"export_style": "默认导出 class。",
		"dependency_injection": "使用 tsyringe，通过 `constructor` 注入依赖。需要确保 `init` 生命周期内完成对 Electron 事件总线的绑定，并在 `off` 内销毁监听。",
		"api_rules": "禁止使用原生的 `fs/promises`，强制导入使用 `fs-extra`。禁止导入 Node 原生模块时使用 `node:` 前缀（如直接用 `import path from 'path'`）。",
		"Same Code 1": "packages/desktop/src/services/WindowService.ts"
	},
	"eRPC Handler (IPC 通信)": {
		"description": "接收并处理来自渲染进程（app）的 eRPC 请求。",
		"fractal_rule": "按业务分类放置在 `src/erpc/` 下。",
		"export_style": "通过 tRPC 的路由定义语法暴露函数，不要把大量业务逻辑硬塞入 Router，必须调用 Service 处理。",
		"Same Code 1": "packages/desktop/src/erpc/app.ts"
	}
}
```
