# Agent Map

This document provides an overview of the packages/desktop module structure and architecture.

## 1. Module Overview

- **Description**: Electron main process and shell
- **Architecture**: Electron + Hono + Rslib

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/desktop",
	"structure": {
		"build": {
			"clean.ts": { "desc": "Clean build artifacts script", "role": "Script" },
			"clean_win_release.ts": { "desc": "Clean Windows release artifacts", "role": "Script" },
			"transform.ts": { "desc": "Build transformation script", "role": "Script" }
		},
		"config.ts": { "desc": "Desktop app configuration", "role": "Config" },
		"electron-builder.ts": { "desc": "Electron Builder configuration", "role": "Config" },
		"metadata": {
			"entitlements.plist": { "desc": "macOS entitlements", "role": "Config" },
			"index.ts": { "desc": "Metadata exports", "role": "Index" }
		},
		"scripts": {
			"dev.ts": { "desc": "Development server script", "role": "Script" },
			"preload.ts": { "desc": "Electron preload script", "role": "Bridge" }
		},
		"src": {
			"apis": { "index.ts": { "desc": "API module exports", "role": "Index" } },
			"app": {
				"Main.ts": { "desc": "Main Window controller", "role": "Controller" },
				"Menu.ts": { "desc": "Application Menu controller", "role": "Controller" },
				"Tray.ts": { "desc": "System Tray controller", "role": "Controller" },
				"index.ts": { "desc": "App module exports", "role": "Index" }
			},
			"index.ts": {
				"desc": "Main process entry point with increased V8 heap for heavy save workloads",
				"role": "Entry"
			},
			"locales": {
				"en": {
					"global.ts": { "desc": "English global strings", "role": "Locale" },
					"index.ts": { "desc": "English locale entry", "role": "Index" }
				},
				"zh-cn": {
					"global.ts": { "desc": "Chinese global strings", "role": "Locale" },
					"index.ts": { "desc": "Chinese locale entry", "role": "Index" }
				}
			},
			"rpcs": {
				"app": {
					"actions.ts": { "desc": "General app actions RPC", "role": "RPC" },
					"checkUpdate.ts": { "desc": "Update check RPC", "role": "RPC" },
					"download.ts": { "desc": "Download manager RPC", "role": "RPC" },
					"exit.ts": { "desc": "App exit RPC", "role": "RPC" },
					"index.ts": { "desc": "App RPCs exports", "role": "Index" },
					"install.ts": { "desc": "App install RPC", "role": "RPC" },
					"onApp.ts": { "desc": "App event subscription RPC", "role": "RPC" },
					"onUpdate.ts": { "desc": "Update event subscription RPC", "role": "RPC" },
					"relaunch.ts": { "desc": "App relaunch RPC", "role": "RPC" },
					"setGlass.ts": { "desc": "Window glass effect RPC", "role": "RPC" },
					"setTheme.ts": { "desc": "Theme setting RPC", "role": "RPC" }
				},
				"memory": {
					"index.ts": {
						"desc": "Polywise memory operations RPC using full poly.save pipeline",
						"role": "RPC"
					}
				},
				"index.ts": { "desc": "RPC routers entry point", "role": "Index" }
			},
			"types": {
				"hono.ts": { "desc": "Hono server types", "role": "Type" },
				"index.ts": { "desc": "Types module exports", "role": "Index" }
			},
			"utils": {
				"conf.ts": { "desc": "Config utility", "role": "Utility" },
				"const.ts": { "desc": "Constants definitions", "role": "Utility" },
				"electron.ts": { "desc": "Electron helpers", "role": "Utility" },
				"entry.ts": { "desc": "Entry point helpers", "role": "Utility" },
				"fs.ts": { "desc": "File system helpers", "role": "Utility" },
				"getDarkIconPath.ts": { "desc": "Dark mode icon path helper", "role": "Utility" },
				"getThemeColor.ts": { "desc": "Theme color helper", "role": "Utility" },
				"index.ts": { "desc": "Utils module exports", "role": "Index" },
				"is.ts": { "desc": "Type check helpers", "role": "Utility" },
				"locale.ts": { "desc": "Locale management", "role": "Utility" },
				"nextTick.ts": { "desc": "Next tick helper", "role": "Utility" },
				"path.ts": { "desc": "Path manipulation helpers", "role": "Utility" },
				"protocol.ts": { "desc": "Protocol registration", "role": "Utility" },
				"relaunch.ts": { "desc": "Relaunch helper", "role": "Utility" },
				"request.ts": { "desc": "HTTP request helper", "role": "Utility" },
				"rstream": {
					"index.ts": { "desc": "Stream module exports", "role": "Index" },
					"pubsub.ts": { "desc": "Publish-Subscribe pattern", "role": "Utility" }
				},
				"safeStorage.ts": { "desc": "Safe storage encryption", "role": "Utility" },
				"serve.ts": { "desc": "Internal server setup", "role": "Utility" },
				"setWindowGlass.ts": { "desc": "Window vibrancy effect", "role": "Utility" },
				"time.ts": { "desc": "Time manipulation", "role": "Utility" },
				"trpc.ts": { "desc": "tRPC setup helper", "role": "Utility" }
			}
		},
		"config": {
			"package.json": { "desc": "Desktop package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" },
			"typings": {
				"extension.d.ts": { "desc": "Extension type definitions", "role": "Type" },
				"global.d.ts": { "desc": "Global type definitions", "role": "Type" },
				"i18n.d.ts": { "desc": "i18n type definitions", "role": "Type" }
			}
		}
	}
}
```

## 3. Operational Guidelines

- **IPC**: All cross-process features are defined in `src/rpcs`
- **Server**: Internal Hono server setup in `src/utils/serve.ts`
- **Communication**: Use `packages/erpc` for renderer communication
