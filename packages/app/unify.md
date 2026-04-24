# Code Style Routing (packages/app)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"components/Session": {
		"path_scope": "packages/app/components/Session",
		"description": "Session composite component entry, model, and local subcomponents.",
		"fractal_rule": "Keep `index.tsx` as view entry, `model.ts` for state orchestration, and `components/` for stable UI blocks.",
		"import_order": "1) react/mobx/tsyringe; 2) @/ aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Component files use PascalCase. Handlers use camelCase. Ordinary variables use snake_case.",
		"Same Code 1": "packages/app/components/Session/index.tsx",
		"Same Code 2": "packages/app/components/Session/model.ts",
		"sample_pool": [
			"packages/app/components/Session/components/Message.tsx",
			"packages/app/components/Session/components/Input.tsx"
		]
	},
	"components/Drawer": {
		"path_scope": "packages/app/components/Drawer",
		"description": "Reusable drawer container with local style module.",
		"fractal_rule": "Keep one entry component and colocated style module only.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local css module and helpers; 4) type-only imports.",
		"naming_rules": "Entry file is `index.tsx`. Local style file is `index.module.css`.",
		"Same Code 1": "packages/app/components/Drawer/index.tsx",
		"Same Code 2": "packages/app/components/Dialog.tsx",
		"sample_pool": ["packages/app/components/Tooltip.tsx", "packages/app/components/Alert.tsx"]
	},
	"components root": {
		"path_scope": "packages/app/components",
		"description": "Top-level shared UI components outside deeper subfolders.",
		"fractal_rule": "Keep atomic reusable components in single files; move complex internals to same-name folder.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Shared component files use PascalCase.",
		"Same Code 1": "packages/app/components/Dialog.tsx",
		"Same Code 2": "packages/app/components/Sidebar.tsx",
		"sample_pool": ["packages/app/components/Tabs.tsx", "packages/app/components/ProviderIcon.tsx"]
	},
	"pages/session": {
		"path_scope": "packages/app/pages/session",
		"description": "Session page composition and page-owned model lifecycle.",
		"fractal_rule": "Use `index.tsx` as page shell, `model.ts` for data/event ownership, and `components/` for menu or section blocks.",
		"import_order": "1) react/mobx/tsyringe; 2) @/ aliases; 3) relative page-local modules; 4) type-only imports.",
		"naming_rules": "Page entry is `index.tsx`. Local subcomponents use PascalCase file names.",
		"Same Code 1": "packages/app/pages/session/index.tsx",
		"Same Code 2": "packages/app/pages/session/model.ts",
		"sample_pool": [
			"packages/app/pages/session/components/Menu/index.tsx",
			"packages/app/pages/session/components/RenameInput.tsx"
		]
	},
	"pages/project/components": {
		"path_scope": "packages/app/pages/project/components",
		"description": "Project page local presentational components for list rows and dialogs; state and event ownership stays in project model.",
		"fractal_rule": "Keep one file per visual block (`ProjectList`, `ProjectListItem`, `ProjectFormDialog`, `ProjectDirectoryTree`, `ProjectDialogShell`) and move data/event orchestration into `pages/project/model.ts`.",
		"import_order": "1) react/dnd/ui libs; 2) @/ aliases; 3) relative page-local modules; 4) type-only imports.",
		"naming_rules": "Component files use PascalCase. Handler names use camelCase. Props objects use `props_*` naming.",
		"Same Code 1": "packages/app/pages/project/components/ProjectList.tsx",
		"Same Code 2": "packages/app/pages/project/components/ProjectFormDialog.tsx",
		"sample_pool": [
			"packages/app/pages/project/components/ProjectListItem.tsx",
			"packages/app/pages/project/components/ProjectDirectoryTree.tsx"
		]
	},
	"pages/project": {
		"path_scope": "packages/app/pages/project",
		"description": "Project page composition with project sidebar, session viewer, todo management, and file tree/detail panes.",
		"fractal_rule": "Use `index.tsx` as page shell, `model.ts` for data/event ownership, and `components/` for sidebar, todo, and file sections.",
		"import_order": "1) react/mobx/tsyringe; 2) @/ aliases and package components; 3) relative page-local modules; 4) type-only imports.",
		"naming_rules": "Page entry is `index.tsx`. Local subcomponents use PascalCase file names.",
		"Same Code 1": "packages/app/pages/session/index.tsx",
		"Same Code 2": "packages/app/pages/session/model.ts",
		"sample_pool": [
			"packages/app/pages/session/components/Menu/index.tsx",
			"packages/app/components/Session/index.tsx"
		]
	},
	"pages/*": {
		"path_scope": "packages/app/pages",
		"description": "General page entries outside the dedicated session folder pattern.",
		"fractal_rule": "Each business page keeps `index.tsx` entry with minimal local composition.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Page folder names stay lowercase; entry is `index.tsx`.",
		"Same Code 1": "packages/app/pages/project/index.tsx",
		"Same Code 2": "packages/app/pages/library/index.tsx",
		"sample_pool": ["packages/app/pages/workflow/index.tsx", "packages/app/pages/database/index.tsx"]
	},
	"setting/model_provider": {
		"path_scope": "packages/app/setting/model_provider",
		"description": "Model provider settings and ai-sdk-panel composition.",
		"fractal_rule": "Keep folder entry in `index.tsx`; nested panel owns its own `components/` and model/type files.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) relative modules; 4) type-only imports.",
		"naming_rules": "Folder remains snake_case where already established; component files use PascalCase where applicable.",
		"Same Code 1": "packages/app/setting/model_provider/index.tsx",
		"Same Code 2": "packages/app/setting/model_provider/ai-sdk-panel/index.tsx",
		"sample_pool": [
			"packages/app/setting/model_provider/ai-sdk-panel/model.ts",
			"packages/app/setting/model_provider/ai-sdk-panel/components/Form/index.tsx"
		]
	},
	"setting/*": {
		"path_scope": "packages/app/setting",
		"description": "Settings domain entries and shared setting-level model/types.",
		"fractal_rule": "Each setting subdomain keeps an `index.tsx` entry, while cross-subdomain state stays in setting root model/types.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) relative modules; 4) type-only imports.",
		"naming_rules": "Existing folder naming is preserved; files follow current mixed conventions consistently.",
		"Same Code 1": "packages/app/setting/index.tsx",
		"Same Code 2": "packages/app/setting/model.ts",
		"sample_pool": [
			"packages/app/setting/general_setting/index.tsx",
			"packages/app/setting/model_setting/index.tsx"
		]
	},
	"panel/*": {
		"path_scope": "packages/app/panel",
		"description": "Panel domain views and panel-level state model.",
		"fractal_rule": "Keep each panel subfolder as entry-based view; shared state stays in panel root model.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Panel subfolder names remain lowercase; entry files are `index.tsx`.",
		"Same Code 1": "packages/app/panel/index.tsx",
		"Same Code 2": "packages/app/panel/model.ts",
		"sample_pool": ["packages/app/panel/session/index.tsx", "packages/app/panel/notification/index.tsx"]
	},
	"models": {
		"path_scope": "packages/app/models",
		"description": "MobX model classes and model barrel export.",
		"fractal_rule": "Keep one model class per file; shared model utilities stay under `models/common`.",
		"import_order": "1) mobx/tsyringe; 2) @/ aliases; 3) relative helpers; 4) type-only imports.",
		"naming_rules": "Class names use PascalCase + Model suffix. Methods use camelCase. Fields use snake_case.",
		"Same Code 1": "packages/app/models/global.ts",
		"Same Code 2": "packages/app/models/setting.ts",
		"sample_pool": ["packages/app/models/theme.ts", "packages/app/models/common/util.ts"]
	},
	"utils/chat": {
		"path_scope": "packages/app/utils/chat",
		"description": "Chat transport/state utility cluster.",
		"fractal_rule": "Keep one capability per file with `index.ts` as export facade.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local files; 4) type-only imports.",
		"naming_rules": "Classes use PascalCase where already established (`Chat`, `State`). Helper functions use camelCase.",
		"Same Code 1": "packages/app/utils/chat/Chat.ts",
		"Same Code 2": "packages/app/utils/chat/State.ts",
		"sample_pool": ["packages/app/utils/chat/CustomTransport.ts", "packages/app/utils/chat/index.ts"]
	},
	"utils root": {
		"path_scope": "packages/app/utils",
		"description": "General frontend utility functions outside specialized subfolders.",
		"fractal_rule": "Keep utility atoms as single files; split to subfolders only when a capability becomes multi-file.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Functions use camelCase and keep existing file naming conventions for compatibility.",
		"Same Code 1": "packages/app/utils/time.ts",
		"Same Code 2": "packages/app/utils/i18n.ts",
		"sample_pool": ["packages/app/utils/ipc.ts", "packages/app/utils/theme.ts"]
	},
	"hooks": {
		"path_scope": "packages/app/hooks",
		"description": "Reusable React hooks for app UI behavior.",
		"fractal_rule": "Keep one hook per file and expose from `hooks/index.ts`.",
		"import_order": "1) react and third-party hooks libs; 2) @/ aliases; 3) local files; 4) type-only imports.",
		"naming_rules": "Hook files and exports start with `use` in camelCase.",
		"Same Code 1": "packages/app/hooks/useAliveEffect.ts",
		"Same Code 2": "packages/app/hooks/useScrollToBottom.ts",
		"sample_pool": ["packages/app/hooks/useForm.ts", "packages/app/hooks/index.ts"]
	},
	"layout": {
		"path_scope": "packages/app/layout",
		"description": "App shell layout and layout-scoped components/types.",
		"fractal_rule": "Root `index.tsx` as layout entry, with `components/` and `types.ts` as local support.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local modules; 4) type-only imports.",
		"naming_rules": "Layout components use PascalCase names and index entry files.",
		"Same Code 1": "packages/app/layout/index.tsx",
		"Same Code 2": "packages/app/layout/components/Header/index.tsx",
		"sample_pool": ["packages/app/layout/components/Alert.tsx", "packages/app/layout/types.ts"]
	},
	"locales": {
		"path_scope": "packages/app/locales",
		"description": "I18n locale dictionaries and locale barrel files.",
		"fractal_rule": "Group by language folder with `index.ts` per locale and root aggregation.",
		"import_order": "1) local locale files; 2) third-party locale libs if needed; 3) type-only imports.",
		"naming_rules": "Locale folders use kebab/lowercase existing naming. Export keys remain stable.",
		"Same Code 1": "packages/app/locales/en/index.ts",
		"Same Code 2": "packages/app/locales/zh-cn/index.ts",
		"sample_pool": ["packages/app/locales/dayjs/en.ts", "packages/app/locales/dayjs/zh-cn.ts"]
	},
	"appdata": {
		"path_scope": "packages/app/appdata",
		"description": "Application metadata/config entities used by app shell and setup.",
		"fractal_rule": "Keep appdata files as atomic config-oriented entries with root `index.ts` export.",
		"import_order": "1) third-party libs; 2) @/ aliases; 3) local appdata modules; 4) type-only imports.",
		"naming_rules": "File names keep existing lower/camel style for compatibility.",
		"Same Code 1": "packages/app/appdata/app.tsx",
		"Same Code 2": "packages/app/appdata/setting.tsx",
		"sample_pool": ["packages/app/appdata/panel.tsx", "packages/app/appdata/index.ts"]
	},
	"context": {
		"path_scope": "packages/app/context",
		"description": "React context creation and context export barrel.",
		"fractal_rule": "Keep context definition in dedicated file with thin `index.ts` export.",
		"import_order": "1) react libs; 2) @/ aliases; 3) local files; 4) type-only imports.",
		"naming_rules": "Context symbols use PascalCase. Helpers use camelCase.",
		"Same Code 1": "packages/app/context/global.ts",
		"Same Code 2": "packages/app/context/index.ts",
		"sample_pool": ["packages/app/hooks/useMounted.ts", "packages/app/models/global.ts"]
	}
}
```
