# Agent Map

This document provides an overview of the packages/stk module structure and architecture.

## 1. Module Overview

- **Description**: Shared toolkit and utilities
- **Architecture**: Modular utility library

## 2. File Tree & Metadata

```json
{
	"project": "Polywise",
	"module": "packages/stk",
	"structure": {
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
						"separateRoot.ts": { "desc": "Separate root layout logic", "role": "Internal" }
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
				"createDeepCompareEffect.ts": { "desc": "Deep compare effect factory", "role": "Factory" },
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
		"config": {
			"package.json": { "desc": "STK package configuration", "role": "Config" },
			"rslib.config.ts": { "desc": "Rslib configuration", "role": "Config" },
			"tsconfig.json": { "desc": "TypeScript configuration", "role": "Config" }
		}
	}
}
```

## 3. Operational Guidelines

- **Shared Library**: Reusable utilities for all packages
- **Process Independent**: Can be used by both main and renderer processes
- **Utilities**: Place commonly used utilities here rather than in individual packages
