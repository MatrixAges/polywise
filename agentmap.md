# Agent Map

This document provides a high-level overview of the project structure and architecture to guide agents in performing tasks efficiently.

## 1. Overall Architecture

The project is a monorepo organized using a workspace structure, primarily built with TypeScript and Electron.

- **Monorepo Manager**: Turbo/Pnpm
- **Frontend**: React-based SPA located in `packages/app`.
- **Desktop (Shell)**: Electron-based main process and preload scripts in `packages/desktop`.
- **Communication**: Custom tRPC-based IPC layer named `erpc` in `packages/erpc`.
- **Core Utilities**: `packages/stk` (shared toolkit).

## 2. Functional Modules Summary

- **`packages/app`**: The renderer process. A React application using MobX for state management. Responsible for the UI and user interactions.
- **`packages/desktop`**: The main process. Handles system-level operations, window management, tray, and menus. Hosts the internal server via Hono.
- **`packages/erpc`**: The bridge between processes. Implements a type-safe IPC protocol using tRPC patterns.
- **`packages/stk`**: Shared utility library. Contains generic tools for MobX, React, DOM manipulation, and storage.

## 3. Detailed Project File Tree & Metadata

```json
{
	"project": "Polywise",
	"structure": {
		"packages/app": {
			"desc": "React frontend application",
			"architecture": "React + MobX + Rsbuild",
			"src": {
				"appdata": {
					"app.tsx": { "desc": "Main application data entry point", "role": "Provider" },
					"chat.ts": { "desc": "Chat data service logic", "role": "Service" },
					"index.ts": { "desc": "Exports for appdata module", "role": "Index" }
				},
				"components": {
					"Markdown": {
						"components": {
							"A.tsx": { "desc": "Markdown link component", "role": "Component" },
							"Anchor.tsx": {
								"desc": "Markdown anchor link component",
								"role": "Component"
							},
							"Code": {
								"index.module.css": { "desc": "Code block styles", "role": "Style" },
								"index.tsx": { "desc": "Code block component", "role": "Component" }
							},
							"H1.tsx": { "desc": "Markdown H1 heading component", "role": "Component" },
							"H2.tsx": { "desc": "Markdown H2 heading component", "role": "Component" },
							"H3.tsx": { "desc": "Markdown H3 heading component", "role": "Component" },
							"H4.tsx": { "desc": "Markdown H4 heading component", "role": "Component" },
							"H5.tsx": { "desc": "Markdown H5 heading component", "role": "Component" },
							"H6.tsx": { "desc": "Markdown H6 heading component", "role": "Component" },
							"InlineCode.tsx": { "desc": "Inline code component", "role": "Component" },
							"Math.tsx": { "desc": "Math/KaTeX renderer component", "role": "Component" },
							"Mermaid.tsx": { "desc": "Mermaid diagram renderer", "role": "Component" },
							"Pre.tsx": { "desc": "Preformatted text component", "role": "Component" },
							"index.tsx": { "desc": "Markdown sub-components exports", "role": "Index" }
						},
						"index.tsx": { "desc": "Main Markdown viewer component", "role": "Component" }
					},
					"Modal.tsx": { "desc": "Reusable modal dialog component", "role": "Component" },
					"index.ts": { "desc": "Components module exports", "role": "Index" }
				},
				"context": {
					"global.ts": { "desc": "Global application context", "role": "Context" },
					"index.ts": { "desc": "Context module exports", "role": "Index" }
				},
				"hooks": {
					"index.ts": { "desc": "Hooks module exports", "role": "Index" },
					"useScrollToBottom.ts": {
						"desc": "Hook to auto-scroll containers to bottom",
						"role": "Hook"
					},
					"useSize.ts": { "desc": "Hook to observe element size changes", "role": "Hook" }
				},
				"index.tsx": { "desc": "Application entry point", "role": "Entry" },
				"layout": {
					"components": {
						"Page": { "index.tsx": { "desc": "Page layout container", "role": "Layout" } },
						"Panel": { "index.tsx": { "desc": "Panel container component", "role": "Layout" } },
						"Sidebar.tsx": { "desc": "Sidebar layout component", "role": "Layout" },
						"Tab": { "index.tsx": { "desc": "Tab navigation component", "role": "Layout" } },
						"index.ts": { "desc": "Layout components exports", "role": "Index" }
					},
					"index.tsx": { "desc": "Main application layout wrapper", "role": "Layout" },
					"types.ts": { "desc": "Layout related type definitions", "role": "Type" }
				},
				"locales": {
					"antd": {
						"en.ts": { "desc": "Ant Design English locale", "role": "Locale" },
						"zh-cn.ts": { "desc": "Ant Design Chinese locale", "role": "Locale" }
					},
					"dayjs": {
						"en.ts": { "desc": "Day.js English locale", "role": "Locale" },
						"zh-cn.ts": { "desc": "Day.js Chinese locale", "role": "Locale" }
					},
					"en": {
						"ai.ts": { "desc": "English AI related strings", "role": "Locale" },
						"app.ts": { "desc": "English App general strings", "role": "Locale" },
						"chat.ts": { "desc": "English Chat strings", "role": "Locale" },
						"chatbox.ts": { "desc": "English Chatbox strings", "role": "Locale" },
						"components.ts": { "desc": "English Component strings", "role": "Locale" },
						"editor.ts": { "desc": "English Editor strings", "role": "Locale" },
						"global.ts": { "desc": "English Global strings", "role": "Locale" },
						"index.ts": { "desc": "English locale entry", "role": "Index" },
						"layout.ts": { "desc": "English Layout strings", "role": "Locale" },
						"note.ts": { "desc": "English Note strings", "role": "Locale" },
						"setting.ts": { "desc": "English Settings strings", "role": "Locale" }
					},
					"index.ts": { "desc": "Locales module exports", "role": "Index" },
					"zh-cn": {
						"ai.ts": { "desc": "Chinese AI related strings", "role": "Locale" },
						"app.ts": { "desc": "Chinese App general strings", "role": "Locale" },
						"chat.ts": { "desc": "Chinese Chat strings", "role": "Locale" },
						"chatbox.ts": { "desc": "Chinese Chatbox strings", "role": "Locale" },
						"components.ts": { "desc": "Chinese Component strings", "role": "Locale" },
						"editor.ts": { "desc": "Chinese Editor strings", "role": "Locale" },
						"global.ts": { "desc": "Chinese Global strings", "role": "Locale" },
						"index.ts": { "desc": "Chinese locale entry", "role": "Index" },
						"layout.ts": { "desc": "Chinese Layout strings", "role": "Locale" },
						"note.ts": { "desc": "Chinese Note strings", "role": "Locale" },
						"setting.ts": { "desc": "Chinese Settings strings", "role": "Locale" }
					}
				},
				"models": {
					"Global.ts": { "desc": "Global application state model", "role": "Model" },
					"Settings.ts": { "desc": "User settings state model", "role": "Model" },
					"common": {
						"Util.ts": { "desc": "Model utility functions", "role": "Utility" },
						"index.ts": { "desc": "Model common exports", "role": "Index" }
					},
					"index.ts": { "desc": "Models module exports", "role": "Index" }
				},
				"pages": {
					"home": {
						"components": {
							"Sidebar.tsx": { "desc": "Home page sidebar", "role": "View" },
							"index.ts": { "desc": "Home components exports", "role": "Index" }
						},
						"index.tsx": { "desc": "Home page main view", "role": "Page" },
						"types.ts": { "desc": "Home page types", "role": "Type" }
					}
				},
				"presets": {
					"index.ts": { "desc": "Presets module exports", "role": "Index" },
					"mobx.ts": { "desc": "MobX configuration preset", "role": "Config" },
					"window.ts": { "desc": "Window behavior presets", "role": "Config" }
				},
				"settings": {
					"components": {
						"Item.tsx": { "desc": "Settings item component", "role": "Component" },
						"index.ts": { "desc": "Settings components exports", "role": "Index" }
					},
					"index.tsx": { "desc": "Settings page main view", "role": "Page" }
				},
				"styles": {
					"global.css": { "desc": "Global CSS styles", "role": "Style" },
					"index.css": { "desc": "Main CSS entry", "role": "Style" },
					"md.module.css": { "desc": "Markdown specific styles", "role": "Style" },
					"vars.css": { "desc": "CSS variables definition", "role": "Style" }
				},
				"svgs": { "bare.svg": { "desc": "Bare SVG asset", "role": "Asset" } },
				"theme": {
					"antd.ts": { "desc": "Ant Design theme configuration", "role": "Config" },
					"index.ts": { "desc": "Theme module exports", "role": "Index" }
				},
				"types": {
					"app.ts": { "desc": "App domain types", "role": "Type" },
					"dayjs.ts": { "desc": "Day.js type extensions", "role": "Type" },
					"index.ts": { "desc": "Types module exports", "role": "Index" },
					"utils.ts": { "desc": "Utility types", "role": "Type" }
				},
				"typings": {
					"global.d.ts": { "desc": "Global TS declarations", "role": "Type" },
					"i18n.d.ts": { "desc": "i18n TS declarations", "role": "Type" },
					"index.d.ts": { "desc": "Index TS declarations", "role": "Type" },
					"react.d.ts": { "desc": "React TS declarations", "role": "Type" }
				},
				"utils": {
					"PrefixMap.ts": { "desc": "Prefix map utility", "role": "Utility" },
					"antd.ts": { "desc": "Ant Design utilities", "role": "Utility" },
					"capitalizeFirst.ts": { "desc": "String capitalization utility", "role": "Utility" },
					"checkParent.ts": { "desc": "DOM parent check utility", "role": "Utility" },
					"clearStorage.ts": { "desc": "Storage clearing utility", "role": "Utility" },
					"conf.ts": { "desc": "App configuration utility", "role": "Utility" },
					"copy.ts": { "desc": "Clipboard copy utility", "role": "Utility" },
					"execUntil.ts": { "desc": "Execution retry utility", "role": "Utility" },
					"findParent.ts": { "desc": "DOM parent finder utility", "role": "Utility" },
					"flat.ts": { "desc": "Array flattening utility", "role": "Utility" },
					"getGlobal.ts": { "desc": "Global object accessor", "role": "Utility" },
					"getLang.ts": { "desc": "Language detection utility", "role": "Utility" },
					"getValuedObject.ts": { "desc": "Object value filter utility", "role": "Utility" },
					"hash.ts": { "desc": "Hashing utility", "role": "Utility" },
					"i18n.ts": { "desc": "i18n setup utility", "role": "Utility" },
					"index.ts": { "desc": "Utils module exports", "role": "Index" },
					"ipc.ts": { "desc": "IPC client utility", "role": "Utility" },
					"is.ts": { "desc": "Type check utilities", "role": "Utility" },
					"memo.ts": { "desc": "Memoization utility", "role": "Utility" },
					"mermaidRender.ts": { "desc": "Mermaid rendering utility", "role": "Utility" },
					"nextTick.ts": { "desc": "Next tick utility", "role": "Utility" },
					"onWheel.ts": { "desc": "Wheel event utility", "role": "Utility" },
					"relaunch.ts": { "desc": "App relaunch utility", "role": "Utility" },
					"setGlobalAnimation.ts": { "desc": "Global animation controller", "role": "Utility" },
					"shiki.ts": { "desc": "Shiki code highlighting utility", "role": "Utility" },
					"sleep.ts": { "desc": "Async sleep utility", "role": "Utility" },
					"theme.ts": { "desc": "Theme management utility", "role": "Utility" },
					"time.ts": { "desc": "Time formatting utilities", "role": "Utility" }
				}
			},
			"package.json": { "desc": "App package configuration", "role": "Config" },
			"postcss.config.ts": { "desc": "PostCSS configuration", "role": "Config" },
			"rsbuild.config.ts": { "desc": "Rsbuild configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		},
		"packages/desktop": {
			"desc": "Electron main process and shell",
			"architecture": "Electron + Hono + Rslib",
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
				"index.ts": { "desc": "Main process entry point", "role": "Entry" },
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
			"package.json": { "desc": "Desktop package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" },
			"typings": {
				"extension.d.ts": { "desc": "Extension type definitions", "role": "Type" },
				"global.d.ts": { "desc": "Global type definitions", "role": "Type" },
				"i18n.d.ts": { "desc": "i18n type definitions", "role": "Type" }
			}
		},
		"packages/erpc": {
			"desc": "Type-safe IPC library",
			"architecture": "tRPC + Electron IPC",
			"package.json": { "desc": "eRPC package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"src": {
				"constants.ts": { "desc": "IPC Channel constants", "role": "Config" },
				"main": {
					"createIPCHandler.ts": { "desc": "IPC Handler creator", "role": "Provider" },
					"exposeERPC.ts": { "desc": "Preload exposure utility", "role": "Provider" },
					"handleIPCMessage.ts": { "desc": "Message handling logic", "role": "Internal" },
					"index.ts": { "desc": "Main process exports", "role": "Index" },
					"types.ts": { "desc": "Main process types", "role": "Type" },
					"utils.ts": { "desc": "Main process utilities", "role": "Utility" }
				},
				"renderer": {
					"index.ts": { "desc": "Renderer process exports", "role": "Index" },
					"ipcLink.ts": { "desc": "tRPC IPC Link", "role": "Consumer" },
					"utils.ts": { "desc": "Renderer utilities", "role": "Utility" }
				},
				"types.ts": { "desc": "Shared type definitions", "role": "Type" },
				"vendor": {
					"unpromise": {
						"ATTRIBUTION.txt": { "desc": "Attribution file", "role": "Doc" },
						"index.ts": { "desc": "Unpromise library exports", "role": "Index" },
						"types.ts": { "desc": "Unpromise types", "role": "Type" },
						"unpromise.ts": { "desc": "Unpromise implementation", "role": "Library" }
					}
				}
			},
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		},
		"packages/polywise": {
			"desc": "Neuroscience-inspired knowledge graph and memory system",
			"architecture": "PGlite + TypeScript",
			"package.json": { "desc": "Polywise package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"rstest.config.ts": { "desc": "RSTest configuration", "role": "Config" },
			"src": {
				"Article.ts": {
					"desc": "Article manager class for CRUD and search operations",
					"role": "Class"
				},
				"Brain.ts": { "desc": "Brain lifecycle manager with fatigue state machine", "role": "Class" },
				"Pipeline.ts": {
					"desc": "Local model manager with embedding and reranking pipelines. Supports local models and API endpoints.",
					"role": "Class"
				},
				"Polywise.ts": {
					"desc": "Core database API for knowledge graph operations. Includes public instances of Brain, Article, and Pipeline.",
					"role": "Class"
				},
				"index.ts": { "desc": "Main exports", "role": "Index" },
				"sql": {
					"Brain.ts": { "desc": "Brain SQL operations", "role": "SQL" },
					"Polywise.ts": { "desc": "Polywise SQL operations", "role": "SQL" },
					"index.ts": { "desc": "SQL exports", "role": "Index" },
					"meta.ts": { "desc": "Metadata SQL operations", "role": "SQL" },
					"schema.ts": {
						"desc": "Database schema definitions (Nodes/Edges now include JSONB metadata)",
						"role": "Schema"
					}
				},
				"types": {
					"args.ts": { "desc": "Parameter types for functions and constructors", "role": "Type" },
					"index.ts": { "desc": "Types exports", "role": "Index" },
					"polywise.ts": {
						"desc": "Core types (Node, Edge, Triple, Snapshot, BrainState, Migration, etc.)",
						"role": "Type"
					}
				},
				"utils": {
					"calculateFatigue.ts": { "desc": "Fatigue calculation utility", "role": "Utility" },
					"calculateWeight.ts": { "desc": "Weight calculation utility", "role": "Utility" },
					"generateNodePosition.ts": {
						"desc": "Random node position generator",
						"role": "Utility"
					},
					"index.ts": { "desc": "Utils exports", "role": "Index" },
					"isIdle.ts": { "desc": "Idle state checker", "role": "Utility" },
					"migrate.ts": { "desc": "Migration execution utility", "role": "Utility" },
					"validateMigrations.ts": { "desc": "Migration validation utility", "role": "Utility" },
					"migration.ts": { "desc": "Database schema migration system", "role": "Module" }
				}
			},
			"test": {
				"migration.spec.ts": { "desc": "Migration tests", "role": "Test" },
				"test.spec.ts": { "desc": "Core functionality tests", "role": "Test" }
			},
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		},
		"packages/stk": {
			"desc": "Shared toolkit and utilities",
			"architecture": "Modular utility library",
			"package.json": { "desc": "STK package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"src": {
				"common": {
					"DirTree.ts": { "desc": "Directory tree utility", "role": "Utility" },
					"Idle.ts": { "desc": "Idle state utility", "role": "Utility" },
					"id.ts": { "desc": "ID generation utility", "role": "Utility" },
					"index.ts": { "desc": "Common module exports", "role": "Index" },
					"uniqBy.ts": { "desc": "Array unique filter", "role": "Utility" }
				},
				"dnd": {
					"index.ts": { "desc": "DnD module exports", "role": "Index" },
					"updateSort.ts": { "desc": "Sort update utility", "role": "Utility" }
				},
				"dom": {
					"findParent.ts": { "desc": "DOM parent finder", "role": "Utility" },
					"getComputedStyleValue.ts": { "desc": "Computed style reader", "role": "Utility" },
					"getStyleValue.ts": { "desc": "Style reader", "role": "Utility" },
					"index.ts": { "desc": "DOM module exports", "role": "Index" }
				},
				"emittery": {
					"index.ts": { "desc": "Emittery implementation", "role": "Library" },
					"maps.ts": { "desc": "Emittery maps", "role": "Internal" },
					"readme.md": { "desc": "Emittery documentation", "role": "Doc" },
					"types.ts": { "desc": "Emittery types", "role": "Type" }
				},
				"graph": {
					"index.ts": { "desc": "Graph module exports", "role": "Index" },
					"tree": {
						"CompactBox.ts": { "desc": "Compact box tree layout", "role": "Algorithm" },
						"Dendrogram.ts": { "desc": "Dendrogram tree layout", "role": "Algorithm" },
						"Indented.ts": { "desc": "Indented tree layout", "role": "Algorithm" },
						"Mindmap.ts": { "desc": "Mindmap tree layout", "role": "Algorithm" },
						"index.ts": { "desc": "Tree module exports", "role": "Index" },
						"layout": {
							"base.ts": { "desc": "Base layout class", "role": "Internal" },
							"dendrogam.ts": { "desc": "Dendrogram layout logic", "role": "Internal" },
							"hierarchy.ts": { "desc": "Hierarchy layout logic", "role": "Internal" },
							"indented.ts": { "desc": "Indented layout logic", "role": "Internal" },
							"index.ts": { "desc": "Layout module exports", "role": "Index" },
							"layout.ts": { "desc": "General layout logic", "role": "Internal" },
							"mindmap.ts": { "desc": "Mindmap layout logic", "role": "Internal" },
							"nonLayered.ts": { "desc": "Non-layered layout logic", "role": "Internal" },
							"separateRoot.ts": {
								"desc": "Separate root layout logic",
								"role": "Internal"
							}
						},
						"types.ts": { "desc": "Tree types", "role": "Type" },
						"util.ts": { "desc": "Tree utilities", "role": "Utility" }
					}
				},
				"mobx": {
					"copy.ts": { "desc": "MobX object copy utility", "role": "Utility" },
					"index.ts": { "desc": "MobX module exports", "role": "Index" },
					"setStorageWhenChange.ts": { "desc": "Storage sync reaction", "role": "Utility" },
					"setStoreWhenChange.ts": { "desc": "Store sync reaction", "role": "Utility" },
					"types.ts": { "desc": "MobX types", "role": "Type" },
					"useInstanceWatch.ts": { "desc": "Instance watcher hook", "role": "Hook" }
				},
				"react": {
					"createDeepCompareEffect.ts": {
						"desc": "Deep compare effect factory",
						"role": "Factory"
					},
					"handle.ts": { "desc": "React handler utility", "role": "Utility" },
					"index.ts": { "desc": "React module exports", "role": "Index" },
					"memo.ts": { "desc": "React memo utility", "role": "Utility" },
					"useContextSelector.tsx": { "desc": "Context selector hook", "role": "Hook" },
					"useCreateEffect.ts": { "desc": "Effect creation hook", "role": "Hook" },
					"useDeepMemo.ts": { "desc": "Deep memoization hook", "role": "Hook" },
					"useDeepUpdateEffect.ts": { "desc": "Deep update effect hook", "role": "Hook" },
					"useDoubleClick.ts": { "desc": "Double click hook", "role": "Hook" },
					"useSelection.ts": { "desc": "Selection management hook", "role": "Hook" }
				},
				"storage": {
					"extends": {
						"expires.ts": { "desc": "Expiration extension", "role": "Extension" },
						"watch.ts": { "desc": "Watch extension", "role": "Extension" }
					},
					"index.ts": { "desc": "Storage module exports", "role": "Index" },
					"proxy": {
						"object.ts": { "desc": "Object proxy handler", "role": "Internal" },
						"storage.ts": { "desc": "Storage proxy handler", "role": "Internal" },
						"transform.ts": { "desc": "Value transformer", "role": "Internal" }
					},
					"shared.ts": { "desc": "Shared storage logic", "role": "Internal" },
					"typings.d.ts": { "desc": "Storage types declarations", "role": "Type" },
					"utils.ts": { "desc": "Storage utilities", "role": "Utility" }
				},
				"utils": {
					"$.ts": { "desc": "DOM selector shortcut", "role": "Utility" },
					"Handle.ts": { "desc": "Generic handler class", "role": "Utility" },
					"StickyTableHeader.ts": { "desc": "Sticky header helper", "role": "Utility" },
					"date.ts": { "desc": "Date manipulation", "role": "Utility" },
					"file.ts": { "desc": "File manipulation", "role": "Utility" },
					"filter.ts": { "desc": "Filter utilities", "role": "Utility" },
					"index.ts": { "desc": "Utils module exports", "role": "Index" },
					"is.ts": { "desc": "Type checks", "role": "Utility" },
					"memo.ts": { "desc": "General memoization", "role": "Utility" },
					"moveObject.ts": { "desc": "Object move utility", "role": "Utility" }
				}
			},
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		}
	}
}
```

## 4. Operational Guidelines

- **Polywise.off()**: Now an `async` method. ALWAYS `await poly.off()` when closing the database connection.
- **IPC**: ALWAYS check `packages/desktop/src/rpcs` when adding new cross-process features.
- **Shared Logic**: If a utility can be reused, place it in `packages/stk` rather than `packages/app/utils`.
- **Typing**: Use `import type` where possible to maintain clean boundaries between processes.
- **Validation**: Procedures with input MUST use `zod` for validation.
