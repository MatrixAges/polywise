# Polywise CLI 支持方案设计与执行计划

Last Updated: 2026-05-22

## 目标

在 `packages/polywise/src/cli/` 下设计并后续实现一套可复用的 CLI 能力，覆盖两条链路：

1. 前端链路：给 `global_panel_session` 注册 `page_tool`，支持渐进式披露：
      - 有哪些页面 / panel
      - 当前在哪个页面
      - 如何跳转
      - 当前页面的可见 DOM / 语义摘要
2. 后端链路：把可暴露的 RPC 变成可 CLI 化的 API 能力，遵循：
      - `rpc -> openapi -> api_map -> cli`
      - `subscribe` 类型 RPC 不纳入首版 CLI 暴露
      - 给 `global_panel_session` 注册 `api_tool`
      - `api_tool` 和终端 CLI 都支持多层级 `-h`，按索引渐进式披露，不一次性把全部 API 倾倒给 AI

本稿只给出方案和执行计划，不直接进入实现。

---

## 现状基线

### 已确认的代码现状

- `packages/polywise/src/cli/` 目前为空目录，适合从零搭结构。
- 服务端已经有：
     - `/trpc/*`：原始 tRPC
     - `/api/*`：`trpc-to-openapi` 转出的 OpenAPI handler
     - `/sys/*`：少量 Hono API（当前主要是 session SSE / IM webhook）
- `global_panel_session` 已存在，并由前端 panel 直接挂载：
     - [packages/app/panel/session/index.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/panel/session/index.tsx)
- 当前 app 路由真实入口来自：
     - [packages/app/index.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/index.tsx)
- 当前 panel tab 真实入口来自：
     - [packages/app/appdata/panel.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/appdata/panel.tsx)
- 当前 tRPC meta 只声明成 `OpenApiMeta`：
     - [packages/polywise/src/utils/trpc.ts](/Users/xiewendao/Documents/MatrixAges/polywise/packages/polywise/src/utils/trpc.ts)
- 当前只有少量 RPC 已显式打了 `meta.openapi`，大多数业务 RPC 还没有进入 OpenAPI 暴露面。

### 与本需求直接相关的事实

- `session.init` 支持 `global: true`，因此 `global_panel_session` 是一个天然的工具挂载点。
- `global_panel_session` 已被排除在普通 session 列表之外，不会污染常规会话页。
- 前端真实 DOM 在 app 进程/浏览器环境，服务端不能直接读取 React DOM。
  这意味着 `page_tool` 不能只在 `polywise` 服务端闭门实现，必须有 app 侧桥接。

### 首版明确排除

- 所有 `subscription` RPC 的 CLI 化
- 全量原始 DOM 返回
- 让 AI 一次性看到全部页面、全部 API、全部参数细节
- 在普通 session 中默认注册 `page_tool` / `api_tool`

---

## 设计原则

### 1. 渐进式披露优先于全量枚举

无论是 `page_tool`、`api_tool` 还是终端 `polywise ... -h`，根节点只暴露一级索引：

- 顶层分类
- 少量摘要
- 下一层怎么问

只有当调用方继续下钻时，才返回下一层命令、页面、参数或 DOM 摘要。

### 2. 共享一套索引模型

终端 CLI 与 AI tool 不能各自维护一份 help 文案。

应抽出统一的：

- `page_map`
- `api_map`
- `help index renderer`
- `command resolver`

这样终端 `-h` 和 `page_tool/api_tool action=help` 才会天然一致。

### 3. 前端页面能力必须走桥接，不走猜测

服务端只能知道“定义上有哪些页面”，看不到“用户当前打开了哪个页面、当前 DOM 是什么”。

因此必须拆成两层：

- 静态页面注册表：定义有哪些 page/panel、可接受哪些参数
- 运行时页面状态桥：当前 route、panel tab、可见 section、DOM 语义快照

### 4. OpenAPI 是后端 CLI 化的准入门槛

只有具备 `meta.openapi` 的非订阅 RPC 才能进入 `api_map`。

这保证：

- HTTP 调用途径清晰
- CLI 能直接复用路径/方法/入参定义
- 暴露面可控

### 5. 首版优先“可枚举、可跳转、可调用、可帮助”

不先追求：

- 自动生成极其华丽的 man page
- 全量 schema 文档站
- 前端所有组件级动作都可控

先打通最小但完整的闭环。

---

## 总体架构

### 分层

```text
frontend app runtime
  -> page registry
  -> page runtime bridge
  -> page_map
  -> page_tool / page CLI

backend rpc
  -> openapi meta
  -> api_map builder
  -> shared help index
  -> api_tool / api CLI
```

### 建议目录

```text
packages/polywise/src/cli/
  index.ts
  types.ts
  shared/
    help.ts
    tree.ts
    render.ts
  api/
    meta.ts
    collect.ts
    apiMap.ts
    call.ts
    help.ts
  page/
    pageMap.ts
    registry.ts
    bridge.ts
    help.ts
  commands/
    api.ts
    page.ts
    root.ts
```

app 侧建议补充：

```text
packages/app/
  appdata/page.ts
  runtime/pageBridge.ts
  runtime/pageSnapshot.ts
```

> `page` 的静态注册可在 app 内维护，最终通过桥接同步给服务端或直接由 app 响应 `page_tool` 查询。

---

## 后端链路设计：`rpc -> openapi -> api_map -> cli`

## 1. 扩展 RPC meta

当前 `p = initTRPC.meta<OpenApiMeta>()` 过窄，不足以描述 CLI 帮助层级。

建议改成：

```ts
type CliProcedureMeta = {
	cli?: {
		group?: string[]
		name?: string
		summary?: string
		hidden?: boolean
		examples?: string[]
	}
}

type ProcedureMeta = OpenApiMeta & CliProcedureMeta
```

然后在 [packages/polywise/src/utils/trpc.ts](/Users/xiewendao/Documents/MatrixAges/polywise/packages/polywise/src/utils/trpc.ts) 中统一使用 `ProcedureMeta`。

### 目的

- `openapi` 决定 HTTP 暴露
- `cli` 决定命令树展示与帮助文案
- 两者共存于同一 procedure 元信息

## 2. OpenAPI 暴露策略

首版只纳入：

- `query`
- `mutation`
- 且 `meta.openapi` 已定义的 procedure

明确排除：

- `subscription`
- 仅前端内部事件桥接 procedure
- 需要长连接 / 实时推送的 watch 类接口

### 建议规则

- `watch*`、`progress`、`heartbeat subscription` 默认不进入 CLI
- 如果一个 namespace 里既有 `query/mutation` 又有 `subscription`，只收前者

## 3. `api_map` 结构

`api_map` 是 CLI 与 `api_tool` 的唯一后端能力索引。

建议结构：

```ts
interface ApiMapItem {
	id: string
	rpc_path: string
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	openapi_path: string
	cli_path: string[]
	group_path: string[]
	summary: string
	input_hint: string[]
	examples: string[]
	hidden?: boolean
}
```

示例：

```ts
{
  id: 'session.create',
  rpc_path: 'session.create',
  method: 'POST',
  openapi_path: '/session/create',
  cli_path: ['api', 'session', 'create'],
  group_path: ['session'],
  summary: 'Create a new session',
  input_hint: ['--title <text>', '--project-id <id>'],
  examples: ['polywise api session create --title "Daily Review"']
}
```

## 4. `api_map` 构建方式

建议不要手写整张表。

应从 router 自动收集：

1. 遍历 `router` record
2. 找到每个 procedure 的：
      - 类型：query / mutation / subscription
      - `meta.openapi`
      - `meta.cli`
3. 过滤掉 subscription
4. 产出 `api_map`

### 这样做的好处

- 新 RPC 进入 CLI 只需补 meta，不需要改两份表
- CLI 与 OpenAPI 暴露面对齐
- 后续还能复用到文档生成

## 5. `api_tool` 设计

`api_tool` 仅注册到 `global_panel_session`。

建议 action：

- `help`
- `list`
- `schema`
- `call`

### `help`

用途：多层级帮助索引。

示例：

- `help()`：只返回顶层 group，如 `session`, `project`, `agent`, `post`
- `help({ path: ['session'] })`：返回 `session` 下的 commands
- `help({ path: ['session', 'create'] })`：返回该命令摘要、参数提示、示例

### `list`

用途：按关键词或 group 做模糊筛选，但默认结果数受限。

### `schema`

用途：在需要时再暴露参数层，而不是 root help 就给全部字段。

返回内容应是“压缩版 schema 摘要”，不是把整份 zod/openapi schema 原样倾倒给模型。

### `call`

用途：执行具体 API。

流程：

1. `api_tool` 根据 `api_map` 找到目标
2. 校验 target 是否允许 CLI 调用
3. 规范化输入
4. 通过统一 HTTP client 调 `/api/*`
5. 返回压缩后的 JSON 结果

## 6. 终端 CLI 设计

建议顶层入口：

```bash
polywise api -h
polywise api session -h
polywise api session create -h
polywise api session create --title "Daily Review"
```

### 核心点

- `-h` 由共享 help engine 渲染
- CLI 命令解析也基于 `api_map`
- 不依赖硬编码的多层命令定义

### 为什么建议做自定义 help engine

因为这里的重点不是“能解析命令”而是“分层索引披露”。

常规 CLI 框架擅长静态命令树，但：

- `api_tool` 也要共用同一套 help 结果
- 页面工具也要共用同一套 help 机制

因此更合理的方式是：

- 自建一个轻量 command tree
- CLI 和 tool 都只是不同入口

---

## 前端链路设计：`page_map -> page runtime bridge -> page_tool`

## 1. 为什么需要两层 page 能力

仅靠文件系统或 React 路由定义，只能知道“有哪些页面”；
但用户要求的还包括：

- 当前页面
- 如何跳转
- 当前 DOM 内容

这些必须依赖运行时状态。

因此应拆成：

1. 静态 `page_map`
2. 运行时 `page_bridge`

## 2. `page_map` 结构

建议覆盖两类实体：

- route page
- panel page

建议结构：

```ts
interface PageMapItem {
	id: string
	kind: 'route' | 'panel'
	title: string
	parent_id?: string
	route_path?: string
	panel_tab?: string
	summary: string
	params_hint: string[]
	children?: string[]
}
```

建议首版静态来源：

- route：从 [packages/app/index.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/index.tsx) 对齐实际路由
- 顶部导航：从 `nav_items`
- panel：从 [packages/app/appdata/panel.tsx](/Users/xiewendao/Documents/MatrixAges/polywise/packages/app/appdata/panel.tsx)

### 首版 page 根索引建议

- `home`
- `session`
- `agent`
- `linkcase`
- `post`
- `setting`
- `panel.session`
- `panel.bookmark`
- `panel.pipeline`
- `panel.notification`

### 动态页面

像 `/post/:id` 这类页面应建成模板节点：

- `post.detail`
- 参数提示：`id`

而不是为每个实例 post 生成静态 page id。

## 3. `page_bridge` 运行时桥

### 目标

让服务端/AI 能够拿到 app 当前真实状态：

- 当前 route
- route params
- 当前 panel active tab
- 当前页面可见 section
- 当前页面的语义化 DOM 摘要

### 建议实现方式

app 侧维护一个 runtime bridge，周期性或事件触发式更新以下状态：

```ts
interface PageRuntimeSnapshot {
	route: {
		pathname: string
		params: Record<string, string>
		search: Record<string, string>
	}
	panel: {
		active_tab: string | null
	}
	page_id: string | null
	visible_sections: Array<{
		id: string
		title: string
		kind: 'heading' | 'list' | 'form' | 'editor' | 'chat' | 'detail'
		summary: string
	}>
	actions: Array<{
		id: string
		label: string
		kind: 'navigate' | 'click' | 'input'
	}>
}
```

## 4. DOM 暴露策略

不建议首版直接返回整页 `innerHTML`。

建议分三级：

### Level 1：语义摘要

默认返回：

- 页面标题
- section 列表
- 每个 section 的短摘要
- 可执行动作列表

### Level 2：结构化可见内容

按 section 请求时返回：

- heading
- visible labels
- list items
- selected text excerpt

### Level 3：受限原始 DOM excerpt

只在显式请求时返回：

- 指定 section 的裁剪后 HTML / text
- 有字符上限

### 建议配套标注

为关键页面逐步补充稳定标记，例如：

- `data-page-id`
- `data-page-section`
- `data-page-action`

这样 `page_tool` 读取的是“产品语义结构”，而不是脆弱的 className 树。

## 5. 页面跳转能力

`page_tool` 首版建议支持：

- route navigation
- panel tab switching

建议 action：

- `help`
- `list`
- `current`
- `inspect`
- `navigate`
- `back`

### `current`

返回当前 page snapshot 的 Level 1 信息。

### `inspect`

按 page 或 section 下钻，返回 Level 2/3 信息。

### `navigate`

支持两类 target：

- route target：如 `session`, `post.detail`
- panel target：如 `panel.notification`

如果 target 需要参数，则由 `help` 先提示，再由 `navigate` 接收参数。

## 6. `page_tool` 注册范围

`page_tool` 只挂到 `global_panel_session`。

原因：

- 这是面向 app 全局导航的能力，不是某个普通对话 session 的私有能力
- 避免普通 session 的工具面被无关 UI 操作污染

---

## 渐进式披露与多层 `-h` 机制

## 1. 统一树模型

`api` 和 `page` 都抽象成一棵 help tree：

```ts
interface HelpNode {
	id: string
	title: string
	summary: string
	kind: 'root' | 'group' | 'command' | 'page' | 'section'
	children?: string[]
	examples?: string[]
	hints?: string[]
}
```

## 2. 根节点只暴露一级

示例：

### `polywise api -h`

只展示：

- 可用 namespace
- 每个 namespace 一句话摘要
- 下一步看法：`polywise api <namespace> -h`

### `api_tool.help()`

只展示：

- `session`
- `project`
- `post`
- `agent`
- ...

### `polywise page -h`

只展示：

- route pages
- panel pages
- `current` / `inspect` / `navigate`

## 3. 二级节点展示命令，不展示全部参数细节

例如：

```bash
polywise api session -h
```

返回：

- `create`
- `rename`
- `remove`
- `get-list`
- ...

每个命令只给一句摘要。

## 4. 三级节点再展示参数与示例

例如：

```bash
polywise api session create -h
```

才展示：

- 参数
- 默认值
- 示例
- 输出简述

## 5. 对 AI 的意义

这套机制可以防止：

- context window 被长 API 列表吞掉
- 模型过早接触无关命令
- 页面 / API 使用路径不清晰

---

## 与现有 Session Tool Runtime 的集成

## 1. 挂载点

在 [packages/polywise/src/fst/session/stream/getStream.ts](/Users/xiewendao/Documents/MatrixAges/polywise/packages/polywise/src/fst/session/stream/getStream.ts) 中，对 `global_panel_session` 增加额外工具注入条件。

建议逻辑：

- 普通 session：保持现状
- `global_panel_session`：在 shared runtime 基础上补充：
     - `page_tool`
     - `api_tool`

## 2. 不建议做成所有 session 默认共享工具

原因：

- 会显著扩大普通 session 的工具面
- UI 导航与全局 API 操作并不属于大多数会话的最小必需能力

## 3. 与现有 `meta_tool` 的关系

`meta_tool` 处理的是 custom tool 路由，不适合承接系统 API CLI 化。

因此：

- `meta_tool` 继续负责 custom tool
- `api_tool` 负责系统业务 API
- 二者职责分离

---

## 推荐实施步骤

## Phase 0：基础元信息与共享树模型

目标：

- 定义 CLI 共用 types
- 扩展 tRPC meta 类型
- 定义 help tree / api_map / page_map 数据结构

产物：

- `src/cli/types.ts`
- `src/cli/shared/*`
- `utils/trpc.ts` meta 扩展

验收：

- 可以在不接入具体命令的情况下构造 help tree

## Phase 1：后端 `api_map` 构建

目标：

- 自动从 router 收集非订阅 OpenAPI procedure
- 生成 `api_map`

产物：

- `src/cli/api/collect.ts`
- `src/cli/api/apiMap.ts`

验收：

- 能列出首批已打 `meta.openapi` 的 RPC
- `subscription` 不出现在结果中

## Phase 2：终端 `api` CLI 与 `api_tool`

目标：

- 打通 `polywise api ...`
- 打通 `api_tool.help/schema/call`

产物：

- `src/cli/commands/api.ts`
- `src/fst/tools/api.ts`

验收：

- `polywise api -h`
- `polywise api <namespace> -h`
- `polywise api <namespace> <command> -h`
- `api_tool` 与 CLI 输出树结构一致

## Phase 3：app 侧 `page_map` 与 runtime bridge

目标：

- 建立页面静态索引
- 建立当前页面状态桥

产物：

- `packages/app/appdata/page.ts`
- `packages/app/runtime/pageBridge.ts`
- 服务端接收/读取当前页面状态的桥接接口

验收：

- 能读取当前 route
- 能读取当前 panel tab
- 能拿到页面 section 摘要

## Phase 4：`page_tool` 与 page CLI

目标：

- 给 `global_panel_session` 注入 `page_tool`
- 提供 `polywise page ...`

产物：

- `src/fst/tools/page.ts`
- `src/cli/commands/page.ts`

验收：

- `polywise page -h`
- `polywise page current`
- `polywise page navigate ...`
- `page_tool.current/inspect/navigate`

## Phase 5：扩面与治理

目标：

- 给更多 RPC 补 `meta.openapi` 与 `meta.cli`
- 为关键页面补 `data-page-*` 标记
- 完善测试

验收：

- 新增 RPC 纳入 CLI 的流程稳定
- 页面摘要在关键页面上稳定可用

---

## 风险与关键决策

## 1. 风险：OpenAPI 覆盖面目前过低

当前只有少数 RPC 进入 `meta.openapi`。

影响：

- `api_map` 首版可用面会比较小

应对：

- 先跑通链路
- 再按优先级补 meta，而不是先要求全量覆盖

## 2. 风险：前端 DOM 摘要如果直接扫 DOM，会非常脆弱

影响：

- className 变化就可能导致摘要漂移

应对：

- 首版以页面注册和语义 section 为主
- 关键页面逐步加 `data-page-*` 标记

## 3. 风险：CLI 框架过重会与“共享 help engine”冲突

应对：

- 帮助树和命令解析逻辑优先自研轻量层
- 外部框架只作为 argv 入口，不承载帮助体系本身

## 4. 关键决策：`page_tool` 只挂 `global_panel_session`

这是正确的边界。

如果后续证明某些 agent/session 也需要页面操控，再单独放开，不要一开始泛化。

---

## 建议首批纳入的 API 与页面范围

## API

建议先挑简单、同步、非 watch 的能力：

- `session.create`
- `session.rename`
- `session.remove`
- `project.list`
- `tool.query`
- `home.query`
- `post.query`
- `post.read`

前提：补齐 `meta.openapi`。

## 页面

建议先覆盖稳定主路径：

- `/`
- `/session`
- `/agent`
- `/linkcase`
- `/post`
- `/setting`
- `panel.session`
- `panel.notification`

动态详情页如 `/post/:id` 放在第二批。

---

## 建议的评审结论格式

你审阅时可以直接给我以下结论之一：

1. 方案可执行，按本稿 Phase 0-2 先做后端 CLI 与 `api_tool`
2. 方案可执行，按本稿全量推进
3. 先缩范围，只做 `api_tool`，暂缓 `page_tool`
4. 先缩范围，只做 `page_tool` 的 list/current/navigate，不做 DOM inspect
5. 需要我先改稿，重点调整：
      - `page_tool` 粒度
      - `api_map` 生成方式
      - 多层 `-h` 形态
      - `global_panel_session` 挂载边界

---

## 结论

这项需求适合按“共享索引层”来做，而不是分别给终端、OpenAPI、AI tool、前端桥各写一套。

最重要的三个落点是：

1. 扩展 procedure meta，让 `openapi` 与 `cli` 元信息同源
2. 把 `api_map` / `page_map` 变成唯一索引层
3. 明确 `page_tool` 必须通过 app runtime bridge 获得当前页面与 DOM 摘要

只要这三个决策不偏，后续实现可以分阶段推进，不会返工。
