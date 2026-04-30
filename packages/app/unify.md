# Code Style Routing (packages/app)

This routing table is scoped to folder-level matching. The matcher must use `path_scope` longest-prefix wins.

## Tree JSON Routing Table

```json
{
	"components/Session": {
		"path_scope": "packages/app/components/Session",
		"sample_pool": [
			"packages/app/components/Session/components/Message.tsx",
			"packages/app/components/Session/components/Input.tsx"
		]
	},
	"components/Drawer": {
		"path_scope": "packages/app/components/Drawer",
		"sample_pool": ["packages/app/components/Tooltip.tsx", "packages/app/components/Alert.tsx"]
	},
	"components root": {
		"path_scope": "packages/app/components",
		"sample_pool": ["packages/app/components/Tabs.tsx", "packages/app/components/ProviderIcon.tsx"]
	},
	"pages/session": {
		"path_scope": "packages/app/pages/session",
		"sample_pool": [
			"packages/app/pages/session/components/Menu/index.tsx",
			"packages/app/pages/session/components/RenameInput.tsx"
		]
	},
	"pages/project/components": {
		"path_scope": "packages/app/pages/project/components",
		"sample_pool": [
			"packages/app/pages/project/components/Menu.tsx",
			"packages/app/pages/project/components/MenuItem.tsx"
		]
	},
	"pages/project": {
		"path_scope": "packages/app/pages/project",
		"sample_pool": [
			"packages/app/pages/session/components/Menu/index.tsx",
			"packages/app/components/Session/index.tsx"
		]
	},
	"pages/todo": {
		"path_scope": "packages/app/pages/todo",
		"sample_pool": [
			"packages/app/pages/project/components/AddModal.tsx",
			"packages/app/pages/session/components/RenameInput.tsx"
		]
	},
	"pages/*": {
		"path_scope": "packages/app/pages",
		"sample_pool": ["packages/app/pages/workflow/index.tsx", "packages/app/pages/database/index.tsx"]
	},
	"setting/model_provider": {
		"path_scope": "packages/app/setting/model_provider",
		"sample_pool": [
			"packages/app/setting/model_provider/ai-sdk-panel/model.ts",
			"packages/app/setting/model_provider/ai-sdk-panel/components/Form/index.tsx"
		]
	},
	"setting/*": {
		"path_scope": "packages/app/setting",
		"sample_pool": [
			"packages/app/setting/general_setting/index.tsx",
			"packages/app/setting/model_setting/index.tsx"
		]
	},
	"panel/*": {
		"path_scope": "packages/app/panel",
		"sample_pool": ["packages/app/panel/session/index.tsx", "packages/app/panel/notification/index.tsx"]
	},
	"models": {
		"path_scope": "packages/app/models",
		"sample_pool": ["packages/app/models/theme.ts", "packages/app/models/common/util.ts"]
	},
	"utils/chat": {
		"path_scope": "packages/app/utils/chat",
		"sample_pool": ["packages/app/utils/chat/CustomTransport.ts", "packages/app/utils/chat/index.ts"]
	},
	"utils root": {
		"path_scope": "packages/app/utils",
		"sample_pool": ["packages/app/utils/ipc.ts", "packages/app/utils/theme.ts"]
	},
	"hooks": {
		"path_scope": "packages/app/hooks",
		"sample_pool": ["packages/app/hooks/useForm.ts", "packages/app/hooks/index.ts"]
	},
	"layout": {
		"path_scope": "packages/app/layout",
		"sample_pool": ["packages/app/layout/components/Alert.tsx", "packages/app/layout/types.ts"]
	},
	"locales": {
		"path_scope": "packages/app/locales",
		"sample_pool": ["packages/app/locales/dayjs/en.ts", "packages/app/locales/dayjs/zh-cn.ts"]
	},
	"appdata": {
		"path_scope": "packages/app/appdata",
		"sample_pool": ["packages/app/appdata/panel.tsx", "packages/app/appdata/index.ts"]
	},
	"context": {
		"path_scope": "packages/app/context",
		"sample_pool": ["packages/app/hooks/useMounted.ts", "packages/app/models/global.ts"]
	}
}
```
