## 核心执行流程

- **上下文落盘（强制）**：接收用户指令后、调用其他工具前，必须先通过 `bash` 执行 `date` 获取时间，把用户原始输入翻译成英文后写入 `.prompts/YYYY-MM-DD/HH-mm-ss.md`。
- **语言一致**：必须使用与用户输入完全一致的语言回复。
- **路径安全**：调用文件工具前，如果不是明确的绝对路径，必须先用 `glob` 或 `ls` 确认真实位置，禁止凭记忆猜路径。
- **测试脚本隔离（强约束）**：通过 `bash` 生成的任意临时验证脚本（不限于 `.ts/.sql/.sh`）严禁放在仓库根目录或业务源码目录，必须放到对应子包 `.test/` 下；若无明确子包，也必须创建临时 `.test/` 并尽量清理。
- **完整替换**：使用编辑工具时，替换片段必须提供足够上下文并写入完整业务逻辑，严禁使用 `...` 省略代码。
- **范围限制**：改动严格限定在用户明确提及的文件或模块；若涉及未提及模块，必须先与用户确认。
- **方案先行**：任何会产生写入的动作（编辑、创建文件、会修改文件的命令）前，必须先给出完整草案并等待用户明确同意。
- **受保护目录**：严禁读取、修改任何 `__` 开头目录（如 `__codegrave__`）。
- **输出简洁**：禁止客套话和无关说明，直接给结果。

## Unify Hard Gate (New)

- **No Unify, No Write**: If any step below is missing, stop all write operations immediately:

1. Read target package `unify.md` and match a node.
2. Verify `Same Code 1` and `Same Code 2` paths are reachable.
3. Read `Same Code 1` and extract the structural skeleton.
4. Read `Same Code 2` and complete anti-overfitting comparison.

- **Fix Route First When Samples Break**: If any `Same Code` path is invalid, update the corresponding `unify.md` first. Skipping samples and directly editing business code is prohibited.
- **No Silent Downgrade**: Without explicit user authorization, do not downgrade Unify from hard-blocking to warning-only.

## 核心规范文件协作指南

- **`agentmap.md`（架构与状态地图）**

1. **何时使用**：保存上下文后、读取其他代码前必须先读；任务结束前，只要有文件增删改，必须同步更新其 JSON 树。
2. **作用**：保证对目标包当前物理结构和模块职责有一致认知。

- **`unify.md`（风格路由表）**

1. **何时使用**：创建新文件、重构模块、编写核心逻辑前必须读取。
2. **作用**：通过路由匹配模板样例，执行像素级仿写，控制代码熵增。

- **`coding.md`（编码规范）**

1. **何时使用**：凡涉及写码、改码、评审，必须作为实时约束。
2. **作用**：提供项目语法、架构与强制执行规范。

[CRITICAL]

- 始终使用与用户问题一致的语言。
- 严禁读取 `__codegrave__` 目录任何内容。
- 只允许 `git status`、`git log` 等只读 git 命令；严禁执行 `git push`、`git commit` 等会修改仓库状态的命令。
