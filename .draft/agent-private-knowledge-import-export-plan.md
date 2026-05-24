# Agent 专属知识 + 导入导出方案

Last Updated: 2026-05-24

## 目标

围绕“现实世界数字孪生 agent”补两块能力：

1. agent 除了从全局知识库关联 article，还支持“专属知识”
2. agent 支持导入导出，导出为 `[agent name].papk`

这里的典型场景不是通用问答 agent，而是类似“户承风”这种现实人物数字孪生。方案重点是：

- 不污染全局知识
- 检索边界清晰
- 图谱边界清晰
- pack 可移植、可回放、可清理

---

## 结论先行

推荐直接复用现有 `article.scope_type / scope_id` 做“专属知识”的所有权边界：

- `article.scope_type = 'global'`：全局知识
- `article.scope_type = 'agent'` 且 `scope_id = agent.id`：agent 专属知识
- `agent_article` 继续只表示“agent 关联了某篇全局 article”

也就是说：

- “专属知识”用 `article.scope_*` 表达
- “关联 article”用 `agent_article` 表达

这样可以把“拥有”与“关联”彻底分开，语义最稳定。

导入导出则改为“完整快照包”：

- 导出 agent 自身数据
- 导出 agent 可见且需要随 agent 迁移的 article / chunk / vector / node / edge / relation 数据
- 导入时优先恢复原始快照，而不是重新生成

这样导入出来的 agent 才是完整的数字孪生副本，不依赖目标环境里是否已有对应全局知识。

---

## 现状基线

### 已有基础

- `article` 表已经有 `scope_type: global | project | agent` 和 `scope_id`
- agent session 下的 `content_tool.save` 已经会把内容写成 `scope_type='agent'`
- `agent_article` 已经支持 agent 关联 article
- `node` / `edge` 已经有 `agent_id` 字段，可承载 agent 专属图谱
- `archiver` 已在 `packages/polywise/package.json` 中

### 当前问题

当前实现处于“后端有一半能力，产品语义还没闭环”的状态：

1. `agent_article` 现在只覆盖“关联”，没有覆盖“专属”
2. agent 专属 article 还没有完整 UI
3. `linkcase` 没有“分配给 agent / 关联给 agent”入口
4. 全局 post / home / analytics 查询没有系统性排除 `scope_type='agent'` 的 article
5. 图谱 recall 仍然偏全局，agent 私有文章的 node / edge 边界没有收紧
6. 没有 agent 导入导出链路

---

## 一、专属知识方案

## 1. 核心语义

把知识分成两类：

### A. 全局知识

- 任何 agent 都可能检索到
- article 记录为：
     - `scope_type = 'global'`
     - `scope_id = null`
- 某个 agent 如果想“收藏 / 关联”它，用 `agent_article`

### B. agent 专属知识

- 只有某个 agent 的 `content_tool` / search 能检索到
- article 记录为：
     - `scope_type = 'agent'`
     - `scope_id = <agent_id>`
- 不再依赖 `agent_article`

这两类能力分别对应你的两个需求：

- “从全局知识库添加关联 article” -> `agent_article`
- “专属知识” -> `article.scope_type='agent'`

---

## 2. linkcase 的“分配”与“关联”

### 推荐语义

对 `for='linkcase'` 的 article，支持两种动作：

### 2.1 分配

含义：

- 把一篇 linkcase article 变成某个 agent 的专属知识
- 只能分配给一个 agent
- 分配后，只有该 agent 可以通过 `content_tool` / search 检索到

落库方式：

- 更新 article：
     - `scope_type = 'agent'`
     - `scope_id = target_agent_id`

约束：

- 分配态 article 不允许继续被“关联给多个 agent”
- 为避免语义冲突，分配时应清空该 article 上已有的 `agent_article` 关系

### 2.2 关联

含义：

- 保持它是全局 linkcase 知识
- 允许多个 agent 把它作为参考资料关联

落库方式：

- 保持 article：
     - `scope_type = 'global'`
     - `scope_id = null`
- 新增或删除 `agent_article(agent_id, article_id)`

约束：

- 只有全局态 article 才允许“关联给 agent”
- 如果 article 已处于“分配态”，关联入口应禁用，并提示“请先取消分配”

### 为什么这样分

这是最重要的一条建模决策：

- “分配”表示所有权和检索隔离
- “关联”表示引用关系和内容收藏

两者不要混在一张关系表里，否则 UI、检索、导入导出都会变复杂。

---

## 3. wiki / memory / user 的 agent 专属知识

这三类 article 允许直接由 agent 新建“专属知识”。

### 产品语义

- 这不是全局 post
- 这不是全局 wiki / memory / user 文章
- 这是某个 agent 的私有知识条目

### 推荐创建方式

在 agent Content 面板中：

- 保留“关联全局 article”的搜索区，UI 直接复用 post 详情页 RelatedPanel 的交互
- 同时新增“Add Exclusive”入口
- 仅对 `wiki / memory / user` 开放直接创建
- `linkcase` 不在 agent 页直接新建，仍然从 `linkcase` 页分配

### 落库方式

创建专属 article 时：

- `for in ('wiki', 'memory', 'user')`
- `scope_type = 'agent'`
- `scope_id = agent.id`
- 不写入 `agent_article`

### 删除语义

- `wiki / memory / user` 的专属 article：
     - 从 agent 中移除 = 直接删除 article
- `linkcase` 的专属 article：
     - 从 agent 中移除 = 取消分配，恢复为全局 article
     - 即：
          - `scope_type = 'global'`
          - `scope_id = null`

这两个删除语义应在 UI 上明确区分成：

- `Delete exclusive article`
- `Unassign from agent`

---

## 4. agent Content 面板改造

推荐把当前单一列表拆成“专属 + 关联”两个来源，但仍保留按 `for_type` 切 tab。

### 当前问题

现在 Content 面板的 `article_items` 只来自 `agent_article`，因此：

- 看不到 agent-scope 的专属 article
- 看不出一篇 article 是“专属”还是“关联”

### 推荐交互

每个 `for_type` tab 下展示两个区块：

1. `Exclusive`
2. `Related`

其中：

- `wiki / memory / user`
     - `Exclusive`：可创建、可编辑、可删除
     - `Related`：搜索全局并添加关联
- `linkcase`
     - `Exclusive`：只展示已分配进来的 linkcase article，可取消分配
     - `Related`：搜索全局 linkcase article 并关联

### 复用策略

“关联全局 article”的搜索交互直接复用 post 详情页相关代码和接口风格：

- 搜索框
- 搜索结果列表
- Add 按钮
- Related list

建议新增一组 agent 专用 RPC，但交互风格与 post related 保持一致，而不是硬复用 post 的数据结构。

---

## 5. 查询与检索边界

## 5.1 Agent 内容列表查询

新增 `agent.getKnowledge` 之类的聚合查询，返回：

- `exclusive_articles`
- `related_articles`

或者返回一个 list，但每项带：

- `knowledge_mode: 'exclusive' | 'related'`

查询规则：

- `exclusive`：
     - `article.scope_type='agent'`
     - `article.scope_id=agent_id`
- `related`：
     - `article.scope_type='global'`
     - join `agent_article`

### 重要点

需要做文章去重，但正常情况下不应允许一篇 article 同时既是 exclusive 又是 related。

---

## 5.2 Agent search / content_tool 检索

agent 作用域检索规则统一为：

- 可以检索到所有 `scope_type='global'` 的 article
- 也可以检索到 `scope_type='agent' and scope_id=<owner_agent_id>` 的 article
- 不能检索到其他 agent 的私有 article

也就是：

- global + self-exclusive
- 排除 foreign-exclusive

这条规则已经和现有 `fullTextSearch` 的 `isAllowedScope()` 思路接近，但需要扩展到所有搜索分支，而不是只在部分路径生效。

### 需要统一审计的搜索路径

- `fullTextSearch`
- `lookup`
- `rerankArticle`
- recall -> evaluate -> article 回收链路
- `agent.searchArticles`
- `content_tool`
- `superego/content_tool`

---

## 5.3 全局页面与全局统计必须排除 agent 私有 article

这是这次方案里最容易遗漏的坑。

如果直接往 `article` 表里写 `for='wiki'|'memory'|'user'` 的 agent 专属知识，而不补过滤，私有条目会污染：

- post list
- post read
- home metrics
- analytics / report
- 全局 article 统计

### 统一规则

凡是“面向全局 post / wiki / memory / user”的查询，都必须显式加：

- `article.scope_type = 'global'`

不要再默认用 `for_type` 代替可见性边界。

### 影响范围

至少需要审计：

- `rpc/post/*`
- `rpc/home/query.ts`
- `report/analytics.ts`
- 所有按 `article.for in ('user','wiki','memory')` 做统计的逻辑

---

## 6. 图谱方案

## 6.1 目标

agent 专属 article 产生的：

- node
- edge
- node_chunk 关联

都必须专注于该 agent，而不是落到全局图谱里。

## 6.2 推荐原则

- 全局 article -> `node.agent_id = null`, `edge.agent_id = null`
- agent 专属 article -> `node.agent_id = agent.id`, `edge.agent_id = agent.id`

### 对应效果

- agent 私有知识会形成私有图谱
- global graph 不会被数字孪生 agent 的个人知识污染
- recall 时可以按 agent 作用域收紧

---

## 6.3 为什么现有实现还不够

当前：

- node 有 `agent_id`
- edge 有 `agent_id`
- 但 recall 的 `collectNodes / collectRelated` 仍然默认全局搜
- edge 还缺少“这条 edge 是哪篇 article 提供的” provenance

node 还能通过 `node_chunk -> chunk.article_id` 反推来源，edge 目前不行。

---

## 6.4 推荐补一张 provenance 表：`edge_article`

建议新增：

```ts
edge_article(
  edge_id text not null references edge(id) on delete cascade,
  article_id text not null references article(id) on delete cascade,
  created_at timestamp,
  primary key (edge_id, article_id)
)
```

### 作用

1. 知道一条 edge 由哪些 article 支撑
2. article 取消分配 / 删除 / 重新抽取时，可以做 scoped cleanup
3. import 后重建图谱时，可以稳定回写 provenance

### 为什么 node 不一定要补 `node_article`

node 侧已有 `node_chunk`，而 chunk 已经知道 `article_id`，足够做 article -> node 回溯。

---

## 6.5 图谱抽取统一成“可传 scope”的公共服务

当前 post 和 linkcase 都各自有一套：

- `ensureGlobalNode`
- `ensureGlobalEdge`
- `linkNodesToChunks`

推荐抽成统一服务：

- `ensureScopedNode({ agent_id })`
- `ensureScopedEdge({ agent_id })`
- `extractArticleGraph({ article_id, content, graph_scope })`

其中：

- `graph_scope = { type: 'global' }`
- `graph_scope = { type: 'agent', agent_id }`

### 使用方式

- global post / linkcase extract -> global graph
- agent exclusive wiki / memory / user -> agent graph
- linkcase assign -> agent graph rebuild

---

## 6.6 recall 改造

`collectNodes` 和 `collectRelated` 需要支持 agent scope。

### 推荐规则

agent session 下：

- 允许命中 global node
- 允许命中 `agent_id = owner_agent.id` 的 node
- 不允许命中其他 agent 的 node

图遍历时：

- global node 只走 global edge
- agent node 只走该 agent 的 edge

不要让 global graph 和 agent graph 在 recall 时隐式串图。

---

## 6.7 linkcase “分配”时的图谱处理

这是最特殊的一个动作。

一个原本全局的 linkcase article 被分配为 agent 专属后，必须把它的图谱从“全局语义”切成“agent 语义”。

### 推荐处理

执行 `rebuildArticleGraph(article_id, target_agent_id)`：

1. 删除该 article chunks 对应的 `node_chunk`
2. 删除该 article 对应的 `edge_article`
3. 重新抽 triples
4. 用 `agent_id = target_agent_id` 建 node / edge
5. 重建 `node_chunk` 与 `edge_article`

### 历史数据问题

旧数据里没有 `edge_article` 的 article，会存在历史 global edge 无法精准回收的问题。

推荐策略：

- 新方案落地后，所有新抽取都写 `edge_article`
- 对历史 article：
     - 首次发生 assign / unassign / import rebuild 时，进行一次 scoped rebuild
     - 对残留孤儿 edge，不做阻塞式全量回填，交给后台清理任务逐步回收

这比一次性重跑所有历史文章更现实。

---

## 7. API 设计建议

## 7.1 Agent 侧

建议新增或重组以下 RPC：

- `agent.getKnowledge`
- `agent.searchGlobalArticles`
- `agent.createExclusiveArticle`
- `agent.updateExclusiveArticle`
- `agent.deleteExclusiveArticle`
- `agent.unassignExclusiveLinkcaseArticle`
- `agent.exportPack`
- `agent.importPack`

### 行为定义

- `searchGlobalArticles`
     - 只搜 `scope_type='global'`
     - 用于“添加关联”
- `createExclusiveArticle`
     - 只允许 `wiki | memory | user`
     - 产出 `scope_type='agent'`
- `deleteExclusiveArticle`
     - 只允许删本 agent 的非-linkcase 专属 article
- `unassignExclusiveLinkcaseArticle`
     - 只允许把 `for='linkcase'` 的专属 article 退回 global

---

## 7.2 Linkcase 侧

建议新增：

- `agent.assignLinkcaseArticle`
- `agent.unassignLinkcaseArticle`
- `agent.relateLinkcaseArticle`
- `agent.unrelateLinkcaseArticle`
- `agent.getLinkcaseArticleAgentState`

### 返回状态建议

对 linkcase detail / header 需要返回：

- `assigned_agent`
- `related_agents`
- `article_scope_type`
- `article_scope_id`

这样 header 上的按钮可以直接知道当前是：

- 未分配、可关联
- 已分配给谁
- 已关联了哪些 agent

---

## 8. UI 设计建议

## 8.1 Linkcase Content Header

在 content header 右侧新增一个 icon button，建议是：

- 单个 icon button
- 点开一个 popover / dropdown

菜单内容：

- `Assign to Agent`
- `Unassign`
- `Relate to Agent`
- `Remove Relation`

### 状态规则

- 没有 article 时禁用
- article 已 assigned 时：
     - `Assign` 变成“Reassign”
     - `Relate` 禁用
- article 为 global 时：
     - 可 `Assign`
     - 可 `Relate`

### 为什么不用两个常驻按钮

header 已经有 Edit / Fetch / Extract，再塞两个按钮会拥挤。一个入口 + 语义清晰的菜单更稳。

---

## 8.2 Agent Content 面板

### `wiki / memory / user`

- 顶部保留搜索框：用于关联全局 article
- 新增 `New Exclusive` 按钮
- 列表中展示两组：
     - Exclusive
     - Related

### `linkcase`

- 不提供 `New Exclusive`
- 展示：
     - 已分配进来的 Exclusive linkcase
     - 已关联的 Related linkcase

### 列表项建议带的 badge

- `Exclusive`
- `Related`
- `Global`
- `Assigned from Linkcase`

---

## 二、导入导出方案

## 1. 推荐导出边界

这次改成“完整快照包”，不是“只导源数据再重建”。

### 必须导出

- agent 主体数据
     - `agent`
     - `agent_vec`（如果后续确认已实际写入）
- agent 直接关系数据
     - `agent_skill`
     - `agent_article`
     - `agent_document`（如果后续确认也要随 agent 迁移）
- agent 专属 article 全链路数据
     - `article`
     - `chunk`
     - `node_chunk`
     - `node`
     - `edge`
     - `edge_article`
     - `chunk_vec`
     - `node_vec`
     - `edge_vec`
- agent 关联 article 的完整快照
     - 即使这些 article 在源环境里是 global，打包时也要把 article/chunk/node/edge/vector 一并打进去
- linkcase 源链接数据
     - `link`
     - `link_article`
- 其他导入后会影响 agent 行为、且确实属于 agent 数据面的表

### 不导出

- session
- message
- logs
- pin 状态
- pipeline 运行态
- cron / report / notification 等与 agent 知识体无关的数据

### 关键语义变更

对于导出包内的数据，不再把“related global article”当成目标环境里的全局依赖。

而是：

- 在 pack 中完整携带其文章与图谱快照
- 导入时恢复成目标 agent 的私有副本

这样才能满足“导入出来是完整 agent，且不会污染全局”的要求。

---

## 2. `.papk` 文件结构

推荐本质上仍然是 zip，只是扩展名叫 `.papk`。

```text
[agent-name].papk
  manifest.json
  payload/
    agent.json
    relations.json
    articles.json
    chunks.json
    nodes.json
    edges.json
    node_chunks.json
    edge_articles.json
    links.json
    link_articles.json
    vectors/
      agent_vec.ndjson
      chunk_vec.ndjson
      node_vec.ndjson
      edge_vec.ndjson
  assets/
    photo.bin
```

### `manifest.json`

建议字段：

- `pack_version`
- `exported_at`
- `source_app_version`
- `agent_name`
- `mode: "snapshot"`
- `counts`
- `has_vectors`
- `has_graph`

### `agent.json`

保存 agent 主体原始字段。

### 为什么拆成 payload + vectors

- 关系型数据更适合 JSON / NDJSON
- 向量数据体积更大，单独放便于流式读写
- 后续如果要切换成二进制块文件，目录结构不需要再推翻

### 向量文件格式建议

每行一条 NDJSON：

```json
{ "entity_type": "chunk", "source_id": "ck_1", "source_rowid": 123, "vector": "<base64-f32>" }
```

`node_vec` / `edge_vec` 同理。

这里保留 `source_rowid` 只是为了调试与校验，导入时真正恢复依赖的是：

- `source_id`
- 导入后新实体的 `new_rowid`

### FTS 数据是否打包

不建议把 FTS 虚表直接打包。

原因：

- FTS 同样绑定 `rowid`
- 它可以由 `chunk.keywords` 与 `link.url` 无损重建
- 打包它的收益远小于复杂度

所以首版建议：

- 向量打包
- FTS 不打包，导入时精确回填

---

## 3. 导出路径配置

在 setting 中新增：

- `agent_export_dir?: string`

默认值：

- `~/Downloads`

### 推荐实现

- 配置文件仍写到 `config.json`
- 若用户未配置，运行时 fallback 到 `os.homedir()/Downloads`

### 设置页交互

在 General Setting 中新增一个 `Agent Export Directory` 字段：

- 显示当前路径
- `Choose Folder`
- `Reset to Default`

这需要 desktop 层补文件夹选择 RPC。

---

## 4. Desktop 侧能力补充

当前仓库里还没有现成的“选目录 / 选文件”桥接，建议补：

- `desktop.app.pickDirectory`
- `desktop.app.pickFile`
- `desktop.app.revealPath`

用途：

- setting 里选择导出目录
- import 时选择 `.papk`
- export 成功后可选“Show in Finder”

---

## 5. 导出流程

推荐使用你给出的流式组合：

- 压缩：`archiver`
- 解压：`unzipper`

### 导出步骤

1. 读取 agent 主体
2. 收集该 agent 需要随 pack 迁移的完整快照数据集：
      - agent rows
      - knowledge rows
      - graph rows
      - vector rows
      - linkcase rows
3. 在 `app_dir/.temp/export-<job_id>/` 生成中间目录
4. 写入 `manifest.json` 与各 payload 文件
5. 用 `archiver` 流式压缩到：
      - `<agent_export_dir>/<safe-agent-name>.papk`
6. 导出成功后清理 `.temp/export-<job_id>/`

### 需要先解决的图谱归属问题

导出 edge 时，必须知道“哪些 edge 属于该 agent 的知识包”。

所以 `edge_article` 不再只是建议项，而是导入导出要可控的前提设施之一。

没有 `edge_article` 时：

- node 还能通过 `node_chunk -> chunk -> article` 反推
- edge 无法稳定按 article 归属裁剪

因此首版如果要做完整快照导出，建议先补 `edge_article`。

### 文件名规则

- 默认：`[agent name].papk`
- 若重名：
     - `[agent name] (2026-05-24 20-15-03).papk`

---

## 6. 导入流程

导入即创建，不做覆盖更新。

### 导入步骤

1. 用户选择 `.papk`
2. 解压到：
      - `app_dir/.temp/import-<job_id>/`
3. 校验：
      - 扩展名
      - manifest schema
      - pack version
      - 路径穿越
4. 创建新 agent
5. 恢复 agent 主体、skills、tools、model
6. 恢复 article / chunk / node / edge / relation 快照
7. 按新 `rowid` 回填 `agent_vec` / `chunk_vec` / `node_vec` / `edge_vec`
8. 由 `chunk.keywords` / `link.url` 重建 FTS
9. 导入成功后删除 `.temp/import-<job_id>/`

### 命名冲突

agent 名冲突时不覆盖，直接创建：

- `户承风`
- `户承风 (Imported)`

必要时再追加时间戳。

### 导入后的所有知识默认私有化

这是为了满足“不污染全局”的目标。

即使某些 article 在源环境里原本只是：

- global article
- 被 `agent_article` 关联

只要它被打进这个 agent pack，导入后都应恢复为：

- `scope_type='agent'`
- `scope_id=new_agent.id`

必要时保留一个字段：

- `origin_knowledge_mode: 'exclusive' | 'related'`

用于 UI 展示“它原来是直接专属，还是原来只是关联快照”，但底层可见性一律私有。

---

## 7. ID / RowID 恢复策略

这是完整快照导入里最关键的技术点。

### 7.1 不能直接原样插入向量表

当前：

- `vec.agent_vec`
- `vec.chunk_vec`
- `vec.node_vec`
- `vec.edge_vec`

都是按宿主表的 `rowid` 建立关系。

导入到新库后：

- 新插入的 `chunk/node/edge` 很可能获得不同的 `rowid`

所以不能直接把源库里的向量行按旧 `rowid` 插进去。

### 7.2 推荐两层映射

导入时维护：

- `old_id -> new_id`
- `old_rowid -> new_rowid`（按实体类型分别维护）

流程：

1. 插入 `article/chunk/node/edge`，保留业务字段，生成新 id
2. 查询每条新记录的新 `rowid`
3. 读取 pack 内的向量记录
4. 用 `source_id -> new_rowid` 映射插入 `vec.*`

### 7.3 ID 是否保留原值

不建议直接复用原始业务 id。

推荐：

- 导入后生成新 id
- 通过映射恢复所有外键

原因：

- 避免与目标环境已有数据冲突
- 允许重复导入同一个 pack
- 允许未来做 merge / diff

---

## 8. 相关 article 的导入策略

这次不再做“related global article 复用全局”的方案。

### 统一规则

只要进入 pack，就按 agent 私有快照恢复。

也就是：

- exclusive article -> 私有恢复
- related global article -> 也私有恢复

### 好处

- 导入结果完全自包含
- 不依赖目标机器已有全局知识
- 不会污染目标机器的 global graph / global article
- 适合“现实人物数字孪生”这种封闭知识体

### 代价

- 会产生跨 agent 的重复知识副本

这个代价是可接受的，因为该场景本身追求的是 agent 完整性和隔离性，而不是跨 agent 去重。

---

## 9. 导入后的索引策略

首版导入完成后，默认不重新跑 embedding / triple 抽取。

### 直接恢复

- agent_vec（如果 pack 内存在）
- article
- chunk
- node / edge
- node_chunk / edge_article
- chunk_vec / node_vec / edge_vec

### 精确重建

- FTS
- 其他严格依赖 `rowid`、但可无损重建的辅助索引

### 何时才做异步重建

只在以下情况做后台修复任务：

- pack 缺少某类向量
- pack 来自旧版本，没有 `edge_article`
- 校验发现某些 snapshot 不完整

也就是说：

- 正常导入 = 恢复快照
- 兼容修复 = 条件性后台补建

---

## 10. 失败处理与清理

## 10.1 `.temp` 清理

无论成功还是失败，都必须在 `finally` 里删除：

- `app_dir/.temp/import-<job_id>/`
- `app_dir/.temp/export-<job_id>/`

## 10.2 导入失败回滚

导入的 DB 写入尽量包进事务。

### 事务内

- agent row
- article / chunk / node / edge rows
- relation rows
- link / link_article rows

### 事务外

- UI 通知
- 条件性修复任务

这样可以保证“创建阶段失败”时完整回滚。

## 10.3 安全校验

必须做：

- unzip entry path sanitize，拒绝 `../`
- 限制单 pack 最大体积
- 限制单个 json / ndjson 文件最大体积
- manifest version check
- base64 vector 长度与维度校验
- 对未知字段 tolerant read，但不 silent execute

---

## 三、分阶段实施建议

## Phase 1. 私有知识模型闭环

- agent Content 面板支持 exclusive + related
- `wiki / memory / user` 可创建 exclusive
- 全局列表与统计排除 `scope_type='agent'`
- `agent.getKnowledge` / `createExclusiveArticle` / `deleteExclusiveArticle`

## Phase 2. linkcase 分配 / 关联

- linkcase header 增加 agent 操作按钮
- `Assign / Unassign / Relate / Unrelate`
- 检索边界生效

## Phase 3. agent-scoped 图谱

- 公共 scoped graph rebuild 服务
- `edge_article`
- recall scope 化

## Phase 4. 导入导出

- setting 配置导出目录
- export `.papk`
- import `.papk`
- snapshot restore
- vector rowid remap

---

## 四、我建议你 review 时重点看这 7 个决策

1. 是否接受“专属知识 = `article.scope_type='agent'`，关联知识 = `agent_article`”这套建模。
2. linkcase 的“分配”和“关联”是否明确设为互斥。
3. `wiki / memory / user` 的 agent 专属知识是否只在 agent 页创建，不进入 post 页。
4. 是否接受 pack 改为“完整快照包”，连 article/chunk/node/edge/vector 一起导出。
5. 是否接受 pack 中原本属于 global 的 related article，在导入后也恢复为目标 agent 的私有副本。
6. 是否接受为 edge 增加 `edge_article` provenance 表，作为图谱导出导入的前提设施。
7. 导入是否明确只做“创建新 agent”，并通过 `id` / `rowid` 映射恢复快照，而不做 merge/update。

如果这 7 条你认可，后续实现路径会比较直，不会在中途反复推翻模型。
