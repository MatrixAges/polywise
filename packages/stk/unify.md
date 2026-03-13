# 代码风格路由 (Unify Rules)

本文件定义 `stk` 通用底层工具库的代码风格。

## Tree JSON 路由表

```json
{
	"Utility Pipeline (纯工具链路)": {
		"description": "高度纯粹的通用底层工具集（如字符处理、加密、类型校验），不能依赖任何宿主环境（不能依赖 React，不能强依赖 Node 模块）。",
		"fractal_rule": "按功能簇拆分文件夹（如 `string/`, `object/`）。每一个工具簇暴露出精细的单文件。",
		"export_style": "默认导出匿名箭头函数：`export default (v: string) => {}`。不写显式返回值类型（交由推断）。",
		"Same Code 1": "packages/stk/src/string/index.ts",
		"Same Code 2": "packages/stk/src/object/index.ts"
	}
}
```
