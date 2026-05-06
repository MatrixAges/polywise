# Agent Map

This document provides an overview of the packages/app module structure and architecture.

## 1. Module Overview

- **Description**: React frontend application
- **Architecture**: React + MobX + Rsbuild

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/app",
	"structure": {
		"appdata": {
			"app.tsx": { "desc": "Main application data entry point", "role": "Provider" },
			"chat.ts": { "desc": "Chat data service logic", "role": "Service" },
			"consts.ts": { "desc": "Application constants", "role": "Constant" },
			"icon.tsx": { "desc": "App icon data", "role": "Asset" },
			"index.ts": { "desc": "Exports for appdata module", "role": "Index" },
			"panel.tsx": { "desc": "Panel configuration data", "role": "Config" },
			"setting.tsx": { "desc": "Settings configuration data", "role": "Config" }
		},
		"utils": {
			"desc": "Frontend utility layer for app-wide helpers, including the network tRPC client that now uses superjson on HTTP and WS links so RPC Date fields stay aligned with inferred output types while the Electron IPC client remains transformer-free.",
			"role": "Folder"
		},
		"components": {
			"Alert.tsx": { "desc": "Reusable alert component", "role": "Component" },
			"AutoLabel.tsx": { "desc": "Auto-sizing label component", "role": "Component" },
			"Container.tsx": { "desc": "Layout container component", "role": "Component" },
			"Controller.tsx": { "desc": "App control logic component", "role": "Component" },
			"Todos.tsx": {
				"desc": "Shared project todo list presentation component; all create/rename/delete state and handlers are passed from project page model",
				"role": "Component"
			},
			"FileTree": {
				"index.tsx": {
					"desc": "Shared file tree wrapper based on @pierre/trees that initializes one persistent tree instance per mount, applies theme host styles, and syncs later path changes through model methods instead of remounting the tree",
					"role": "Component"
				},
				"model.ts": {
					"desc": "Shared file tree model that keeps the imperative @pierre/trees instance alive, incrementally appends unseen paths with tree.add, and falls back to resetPaths when the root set changes",
					"role": "Model"
				}
			},
			"ModelSelect.tsx": { "desc": "Default model picker for app settings", "role": "Component" },
			"Dialog.tsx": { "desc": "Modal dialog component", "role": "Component" },
			"ErrorBoundary.tsx": { "desc": "React error boundary", "role": "Component" },
			"Lazy.tsx": { "desc": "Lazy loading wrapper for dynamic imports", "role": "Component" },
			"ProviderIcon.tsx": { "desc": "AI provider icon renderer", "role": "Component" },
			"Show.tsx": { "desc": "Conditional rendering component", "role": "Component" },
			"Sidebar.tsx": { "desc": "Side navigation component", "role": "Component" },
			"Tabs.tsx": { "desc": "Tab navigation component", "role": "Component" },
			"index.ts": { "desc": "Components module exports", "role": "Index" },
			"Session": {
				"desc": "Session chat container with context drawer, message timeline, and input actions including clear/archive operations; input model selector is now controlled by setting.config.default_model so the selected provider/model stays visible after config updates, and Message.tsx now binds reasoning duration by reasoning-part order instead of all-part index so mixed text/tool parts no longer shift or drop the shown duration",
				"role": "Folder"
			}
		},
		"context": {
			"global.ts": { "desc": "Global application context", "role": "Context" },
			"index.ts": { "desc": "Context module exports", "role": "Index" }
		},
		"hooks": {
			"index.ts": { "desc": "Hooks module exports", "role": "Index" },
			"useAliveEffect.ts": { "desc": "Hook for keep-alive effects", "role": "Hook" },
			"useMounted.ts": { "desc": "Hook to check mount status", "role": "Hook" },
			"useScrollToBottom.ts": { "desc": "Hook to auto-scroll containers to bottom", "role": "Hook" },
			"useScrollToItem.ts": { "desc": "Hook to scroll to specific item", "role": "Hook" },
			"useSize.ts": { "desc": "Hook to observe element size changes", "role": "Hook" }
		},
		"index.tsx": { "desc": "Application entry point", "role": "Entry" },
		"layout": {
			"components": {
				"Alert.tsx": { "desc": "Layout alert banner", "role": "Component" },
				"Header": {
					"index.tsx": {
						"desc": "Application header layout with navigation; left area includes workspace selector and a quick-create session trigger that navigates to /session with query intent",
						"role": "Layout"
					},
					"components": {
						"SessionsStatus": {
							"index.tsx": {
								"desc": "Header status trigger that subscribes to pushed running, unread, and todo-error counts through rpc.session.getSessionStatus and opens the status dialog",
								"role": "Component"
							},
							"model.ts": {
								"desc": "Local header sessions-status model that keeps dialog open state, active status tab, selected session id, active-status session list, and aggregated counts synchronized through a dedicated rpc.session.getSessionStatus subscription plus watchSessionStatus-driven list refreshes",
								"role": "Model"
							},
							"SessionDialog.tsx": {
								"desc": "Sessions status dialog with left status-tab session list for the current active status and right shared Session page view for the selected session",
								"role": "Component"
							}
						}
					}
				},
				"index.ts": { "desc": "Layout components exports", "role": "Index" }
			},
			"index.tsx": { "desc": "Main application layout structure", "role": "Layout" },
			"types.ts": { "desc": "Layout type definitions", "role": "Type" }
		},
		"locales": {
			"en": {
				"global.ts": { "desc": "English global strings", "role": "Locale" },
				"provider.ts": { "desc": "English provider strings", "role": "Locale" },
				"index.ts": { "desc": "English locale entry", "role": "Index" }
			},
			"zh-cn": {
				"global.ts": { "desc": "Chinese global strings", "role": "Locale" },
				"provider.ts": { "desc": "Chinese provider strings", "role": "Locale" },
				"index.ts": { "desc": "Chinese locale entry", "role": "Index" }
			},
			"dayjs": {
				"en.ts": { "desc": "Day.js English locale", "role": "Locale" },
				"zh-cn.ts": { "desc": "Day.js Chinese locale", "role": "Locale" }
			},
			"index.ts": { "desc": "Locales module exports", "role": "Index" }
		},
		"models": {
			"common": {
				"files.ts": {
					"desc": "Reusable directory tree state model that resolves home directory roots, lazily appends child directories, normalizes input paths, and resets tree state for consumers such as the project add dialog",
					"role": "Model"
				},
				"util.ts": { "desc": "Model utility functions", "role": "Utility" },
				"index.ts": { "desc": "Model common exports", "role": "Index" }
			},
			"global.ts": { "desc": "Global application state model", "role": "Model" },
			"locale.ts": { "desc": "Locale state model", "role": "Model" },
			"setting.ts": { "desc": "User settings state model", "role": "Model" },
			"theme.ts": { "desc": "Theme state model", "role": "Model" },
			"index.ts": { "desc": "Models module exports", "role": "Index" }
		},
		"pages": {
			"agent": { "index.tsx": { "desc": "Agent page view", "role": "Page" } },
			"bookmark": { "index.tsx": { "desc": "Bookmark page view", "role": "Page" } },
			"browser": { "index.tsx": { "desc": "Browser page view", "role": "Page" } },
			"database": { "index.tsx": { "desc": "Database page view", "role": "Page" } },
			"notebook": { "index.tsx": { "desc": "Notebook page view", "role": "Page" } },
			"todo": {
				"context.ts": {
					"desc": "Todo page model context provider and hook for sidebar, board, and inspector components to share selection and edit actions without prop drilling",
					"role": "Context"
				},
				"components": {
					"Col.tsx": {
						"desc": "Status column renderer that shows the status icon, task count, and todo cards for a single group, now consuming `{ todo, session }` board items while keeping each status body registered as a droppable sortable container for within-column and cross-column moves",
						"role": "Component"
					},
					"Kanban.tsx": {
						"desc": "Scrollable middle board that renders all grouped todo status columns from the page model using `{ todo, session }` items and owns the shared dnd-kit drag context for todo reordering across both kanban and list modes; drag start clears the current selection",
						"role": "Component"
					},
					"Menu.tsx": {
						"desc": "Todo sidebar navigation with Inbox and project scopes, count badges, and active filter switching",
						"role": "Component"
					},
					"Todo.tsx": {
						"desc": "Todo card atom that supports selection, consumes a `{ todo, session }` board item, exposes dnd-kit sortable bindings so each todo can be dragged within or across status columns, and now renders linked session title plus running or idle status on the board",
						"role": "Component"
					},
					"TodoDetail.tsx": {
						"desc": "Closable right-side detail form that persists title immediately through form watch, debounces title and description edits during typing, persists status and priority immediately on selection change with the pending status removed from the selector, and controls linked todo session start or stop actions with realtime title, running state, elapsed time, and button disabled states",
						"role": "Component"
					},
					"index.ts": {
						"desc": "Todo component exports",
						"role": "Index"
					}
				},
				"hooks.ts": {
					"desc": "Todo page hooks including the running-time formatter for linked sessions and the selected-card auto-focus hook that smooth-scrolls the active todo into view after detail status changes",
					"role": "Hook"
				},
				"index.tsx": {
					"desc": "Todo page view that composes the sidebar, kanban board, and a closable right-side detail editor shown for the selected task",
					"role": "Page"
				},
				"model.ts": {
					"desc": "Todo page state model for loading grouped `{ todo, session }` board data where the linked session is resolved only from todo-started execution sessions, tracking the selected todo while deriving its detail session from current board data, starting or stopping linked todo sessions, clearing selection on drag start, applying optimistic same-column or cross-column todo moves, persisting drag reorder updates through rpc.todo.sort plus detail-form updates through rpc.todo.update, and subscribing to rpc.session.watchSessionStatus so linked session title, report, running state, elapsed-time anchor, running_done, unread state, and pushed todo status stay in sync on the todo board and detail pane, with board regrouping handled locally through pages/todo/utils.ts helpers after the pending column removal",
					"role": "Model"
				},
				"types.ts": {
					"desc": "Todo page local types for grouped todo items, status and priority unions, and the right-side detail form payload",
					"role": "Type"
				}
			},
			"project": {
				"context.ts": {
					"desc": "Project page action context provider and hook for nested project components to consume model methods without prop drilling",
					"role": "Context"
				},
				"components": {
					"AddModal.tsx": {
						"desc": "Project creation dialog that binds the directory input, fetch action, and file tree key reset so re-fetching clears all existing tree expansion state before rendering the latest directory list",
						"role": "Component"
					},
					"Menu.tsx": {
						"desc": "Project sidebar menu with a single outer context menu root that resolves right-click targets from project and session rows and now wraps the project list in a dnd-kit sortable context for persistent drag sorting",
						"role": "Component"
					},
					"MenuItem.tsx": {
						"desc": "Project sidebar project/session list atom that renders right-click target metadata, exposes a draggable project header via dnd-kit sortable bindings, uses SessionItem for nested session rows, and forwards click interactions to the page model",
						"role": "Component"
					},
					"SessionItem.tsx": {
						"desc": "Project session row atom aligned to the shared session BaseItem structure with selected, rename shell, and running, unread, or report-backed session data rendering",
						"role": "Component"
					},
					"MenuProjectMenu.tsx": {
						"desc": "Project row context menu content for new session, rename, and delete interactions",
						"role": "Component"
					},
					"MenuSessionMenu.tsx": {
						"desc": "Project session row context menu content for placeholder rename and delete interactions",
						"role": "Component"
					},
					"DialogShell.tsx": {
						"desc": "Dialog shell wrapper used by project create and rename forms",
						"role": "Component"
					},
					"DirectoryTree.tsx": {
						"desc": "Project directory tree selector view atom with path data and selection callback from model",
						"role": "Component"
					},
					"FormDialog.tsx": {
						"desc": "Project form dialog that renders create and rename inputs and forwards events",
						"role": "Component"
					},
					"List.tsx": {
						"desc": "Project list block with drag sorting, dialog rendering, selected project/session props, expansion state, and session pagination data injected from the page model",
						"role": "Component"
					},
					"ListItem.tsx": {
						"desc": "Folder-style project row atom with select/expand behavior, create-session trigger, drag handle, rename/delete dropdown, and nested session list rendering",
						"role": "Component"
					},
					"types.ts": {
						"desc": "Local project component prop types for shared session row rendering",
						"role": "Type"
					}
				},
				"index.tsx": {
					"desc": "Project page view with left project list, center session view, and right file tree/diff pane; it owns model lifecycle and only passes render props to presentational components",
					"role": "Page"
				},
				"model.ts": {
					"desc": "Project page state model loads project/session lists, persists project drag sorting through rpc.project.sort, subscribes to rpc.session.watchSessionStatus to sync nested session title/running/unread state in realtime, and now injects the shared models/common/files directory tree model to drive the add-project dialog without duplicating lazy directory loading state",
					"role": "Model"
				},
				"types.ts": {
					"desc": "Project page type definitions re-exporting shared RPC payload types and project component props",
					"role": "Type"
				}
			},
			"session": {
				"components": {
					"Item.tsx": {
						"desc": "Shared session row atom reused by grouped rows and plain session rows; it centralizes selection, rename input, and pin icon rendering while callers inject per-context title node and context menu",
						"role": "Component"
					},
					"RenameInput.tsx": {
						"desc": "Shared rename input atom reused by session menu group and session item rows",
						"role": "Component"
					}
				},
				"context.ts": {
					"desc": "Session page action context provider and hook to inject menu action functions at top-level and consume them in nested components",
					"role": "Context"
				},
				"index.tsx": {
					"desc": "Session page view with two-column layout, left-side grouped and ungrouped session menu, and right-side Session content using getList/getMoreList RPC data; selection defaults to empty and menu scroll pagination is delegated to the page model. The page now uses a cohesive Menu/ directory with Groups and Sessions section components patterned after components/Session/index.tsx style. Menu now uses a single outer ContextMenu root for all group/session rows and resolves right-click targets by traversing `e.target` ancestors with `data-group-index`, `data-session-index`, and `data-id`. page model subscribes to rpc.session.watchSessionStatus and applies title/running/unread updates in-place for realtime sync, and on entering a session triggers rpc.session.unread to clear unread. menu actions are injected by SessionMenuActionsProvider at page top and consumed by nested menu components via hook with direct method destructuring, avoiding both prop drilling and `actions.xxx` access. The page additionally supports quick-create intent via `quick_create_session=1` query, creates a new session after init, and then clears the query with replace navigation to avoid duplicate creation. Session tab list now includes a bottom Show more fallback trigger (when has_more) so pagination can continue even when the list is not scrollable.",
					"role": "Page"
				}
			},
			"search": { "index.tsx": { "desc": "Search page view", "role": "Page" } },
			"setting": { "index.tsx": { "desc": "Setting page entry point", "role": "Page" } },
			"task": { "index.tsx": { "desc": "Task page view", "role": "Page" } }
		},
		"panel": {
			"agent": { "index.tsx": { "desc": "Agent panel view", "role": "View" } },
			"bookmark": { "index.tsx": { "desc": "Bookmark panel view", "role": "View" } },
			"search": { "index.tsx": { "desc": "Search panel view", "role": "View" } },
			"index.tsx": { "desc": "Main panel view container", "role": "View" },
			"model.ts": { "desc": "Panel container state model", "role": "Model" }
		},
		"presets": {
			"index.ts": { "desc": "Presets module exports", "role": "Index" },
			"mobx.ts": { "desc": "MobX configuration preset", "role": "Config" },
			"window.ts": { "desc": "Window behavior presets", "role": "Config" }
		},
		"setting": {
			"about": { "index.tsx": { "desc": "About setting view", "role": "View" } },
			"general": { "index.tsx": { "desc": "General settings view", "role": "View" } },
			"memory": { "index.tsx": { "desc": "Memory settings view", "role": "View" } },
			"provider": {
				"ai-sdk-panel": {
					"components": { "desc": "Provider panel components", "role": "Component" },
					"providers": { "desc": "Preset AI providers configuration", "role": "Config" },
					"index.tsx": { "desc": "AI SDK configuration panel", "role": "View" },
					"model.ts": { "desc": "AI SDK panel state model", "role": "Model" },
					"types.ts": { "desc": "AI SDK panel type definitions", "role": "Type" }
				},
				"index.tsx": { "desc": "AI provider settings view", "role": "View" }
			},
			"index.tsx": { "desc": "Main setting layout view", "role": "View" },
			"model.ts": { "desc": "Setting layout state model", "role": "Model" },
			"types.ts": { "desc": "Setting layout types", "role": "Type" }
		},
		"styles": {
			"global.css": { "desc": "Global CSS styles", "role": "Style" },
			"index.css": { "desc": "Main CSS entry", "role": "Style" },
			"streamdown.css": {
				"desc": "Streamdown Markdown rendering styles with mermaid flicker prevention",
				"role": "Style"
			},
			"vars.css": { "desc": "CSS variables definition", "role": "Style" },
			"shadcn.css": { "desc": "shadcn/ui base styles", "role": "Style" },
			"utility.css": { "desc": "Utility CSS classes", "role": "Style" }
		},
		"types": {
			"app.ts": { "desc": "App domain types", "role": "Type" },
			"dayjs.ts": { "desc": "Day.js type extensions", "role": "Type" },
			"index.ts": { "desc": "Types module exports", "role": "Index" },
			"utils.ts": { "desc": "Utility types", "role": "Type" }
		},
		"utils": {
			"alert.ts": { "desc": "Alert utility", "role": "Utility" },
			"ipc.ts": { "desc": "IPC client utility", "role": "Utility" },
			"theme.ts": { "desc": "Theme management utility", "role": "Utility" },
			"i18n.ts": { "desc": "i18n setup utility", "role": "Utility" },
			"index.ts": { "desc": "Utils module exports", "role": "Index" }
		}
	}
}
```

## 3. Operational Guidelines

- **IPC Communication**: Use `packages/erpc` for main/renderer communication
- **Shared Logic**: Place reusable utilities in `packages/stk` rather than local `utils/`
