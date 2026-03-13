# 代码风格路由 (Unify Rules)

本文件定义 `app` 前端包的代码风格和组件分形结构约束。Agent 在修改或创建前端页面与逻辑时，必须以此表作为绝对准则。

## Tree JSON 路由表

```json
{
	"React Component (视图组件)": {
		"description": "负责 UI 渲染的无状态或受控 React 组件，不能直接处理复杂的异步业务逻辑。",
		"fractal_rule": "遵循就近原则和组件分形法则：\n1. 轻量级单体组件直接使用单文件（如 `Alert.tsx`）。\n2. 如果组件逻辑超过 80 行，或者内部存在 `map` 列表循环渲染的区块，必须在该目录下新建以组件名命名的文件夹（如 `TaskDetail/`）。\n3. 将主逻辑存入 `TaskDetail/index.tsx`，拆分出的子区块组件放在同级目录（如 `TaskDetail/ListItem.tsx`），保证逻辑收敛，防止扁平目录膨胀。",
		"export_style": "一律使用箭头函数进行默认导出：`export default (props: Props) => {}`。泛型使用 `Array<T>`，禁止 `any`。",
		"naming_rules": "组件文件与函数名强制使用 PascalCase。内部辅助纯函数使用 camelCase。",
		"Same Code 1": "packages/app/components/Alert.tsx",
		"Same Code 2": "packages/app/pages/Setting/index.tsx"
	},
	"MobX Model (状态管理模型)": {
		"description": "负责处理复杂业务逻辑、API 请求调度和跨组件状态共享。",
		"fractal_rule": "放置于对应模块（或全局的）`models/` 目录下。按业务域拆分为独立文件（如 `global.ts`, `theme.ts`）。如果某个页面独有的状态复杂，该页面的文件夹下必须有自己的 `models/` 文件夹。",
		"export_style": "默认导出类：`export default class ModelName`。",
		"dependency_injection": "强制使用 tsyringe，必须使用 `@singleton()` 或 `@injectable()` 装饰类。所有外部依赖（包含其他 Model）必须通过 `constructor(public dep1: Dep1)` 注入。所有副作用监听放入 `init()`，清理逻辑放入 `off()`。",
		"Same Code 1": "packages/app/models/global.ts"
	},
	"Utility Function (纯净工具)": {
		"description": "无副作用纯函数，一律用于计算、数据格式化。",
		"fractal_rule": "按纯粹功能域拆分为文件。例如专门处理时间、处理 DOM、处理 URL。",
		"export_style": "默认导出匿名箭头函数：`export default (args) => {}`。",
		"Same Code 1": "packages/app/utils/format.ts"
	}
}
```
