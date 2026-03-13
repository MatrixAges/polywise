# 代码风格路由 (Unify Rules)

本文件定义 `polywise` 核心引擎包内的代码风格和模块分形结构约束。Agent 在生成代码前，必须读取此 JSON，找到目标节点的 `fractal_rule` (分形与目录深度规则) 和 `Same Code` 样本，进行克隆式编码。

## Tree JSON 路由表

```json
{
	"Pipeline Action (流水线原子函数)": {
		"description": "处理知识库核心业务流水线（分块、向量化、检索等）的纯函数或聚合入口。",
		"fractal_rule": "遵循自然分形生长法则：\n1. 简单的原子功能，直接定义为单文件（如 `getVectors.ts`）。\n2. 当单文件逻辑超过40行，或者内部需要多个子步骤协同（如分块功能既有语义分块又有符号分块），强制新建同名文件夹（如 `getChunks/`），主逻辑作为总调度入口存入 `index.ts`，其余拆分出的子原子函数存在同级目录（如 `getSemanticChunks.ts`、`getSplitChunks.ts`），并仅由 `index.ts` 引入调度。\n3. 所有相关联的辅助类型、配置项如果复杂，也应收敛到该同级目录下。",
		"export_style": "必须使用匿名箭头函数作为默认导出：`export default async (args) => {}`。如果参数超过 2 个，必须封装为一个对象并在首行解构。",
		"naming_rules": "函数与文件名一律采用 camelCase。",
		"Same Code 1": "packages/polywise/src/pipeline/getChunks/index.ts",
		"Same Code 2": "packages/polywise/src/pipeline/getVectors.ts"
	},
	"Database SQL (纯SQL操作)": {
		"description": "存放原生 SQL 语句或拼装 SQL 的纯函数。业务模型不能硬编码 SQL。",
		"fractal_rule": "按数据库表名（如 `nodes.ts`, `edges.ts`）拆分文件存放于 `src/sql/`。如果跨表复杂查询，可以根据业务域新建文件。",
		"export_style": "必须通过按需导出 `export const sql_insert_node = ...` 暴露。严禁 default 导出。",
		"comments_rule": "强制带 JSDoc 注释，详细说明当前 SQL 操作的表与业务作用。",
		"Same Code 1": "packages/polywise/src/sql/nodes.ts"
	},
	"Database Model (数据模型)": {
		"description": "负责调度 SQL 执行并进行数据转换的业务模型。",
		"fractal_rule": "按业务域拆分为独立文件（如 `NodeModel.ts`）存放于 `src/models/`。如果模型职责变大，需拆分为基础模型（读写分离）等。",
		"export_style": "默认导出 class。",
		"dependency_injection": "无强注入，但需统一依赖 `sqlite` 执行器实例。",
		"Same Code 1": "packages/polywise/src/models/NodeModel.ts"
	}
}
```
