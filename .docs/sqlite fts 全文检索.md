在 SQLite 中，全文检索（FTS）并不是通过简单的 index 语法实现的，而是需要创建一个 虚拟表 (Virtual Table)。 [1, 2]
目前 Drizzle ORM 尚未原生支持在 schema 中定义 SQLite 的 VIRTUAL TABLE，因此无法直接通过 sqliteTable 的 index 函数为 content 添加全文索引。 [3, 4]
推荐实现方案
你需要手动执行 SQL 语句来创建 FTS5 虚拟表，并配合 Drizzle 的 sql 模板标签进行查询。

1. 创建 FTS5 虚拟表 (迁移阶段)
   在你的数据库初始化或迁移脚本中，手动执行以下 SQL： [1, 4]

-- 创建一个专用的全文检索虚拟表CREATE VIRTUAL TABLE chunk_fts USING fts5(
content,
tokenize='unicode61' -- 中英文通用的分词器
);

2. 同步数据 (使用触发器)
   为了让 chunk 表的 content 更新时自动同步到 chunk_fts，建议添加触发器： [5]

-- 插入同步CREATE TRIGGER chunk_after_insert AFTER INSERT ON chunk BEGIN
INSERT INTO chunk_fts(rowid, content) VALUES (new.rowid, new.content);END;
-- 更新同步CREATE TRIGGER chunk_after_update AFTER UPDATE ON chunk BEGIN
UPDATE chunk_fts SET content = new.content WHERE rowid = old.rowid;END;
-- 删除同步CREATE TRIGGER chunk_after_delete AFTER DELETE ON chunk BEGIN
DELETE FROM chunk_fts WHERE rowid = old.rowid;END;

3. 在 Drizzle 中进行全文检索查询
   由于 FTS 表在 Drizzle schema 中没有对应定义，你可以使用 sql 标签进行原生查询： [4, 6]

import { sql } from 'drizzle-orm';
// 搜索包含 "关键内容" 的切片const searchKeyword = '关键内容';const results = await db.select({
id: chunk.id,
content: chunk.content,
})
.from(chunk)
.innerJoin(
sql`chunk_fts`,
sql`chunk.rowid = chunk_fts.rowid`
)
.where(sql`chunk_fts MATCH ${searchKeyword}`)
.orderBy(sql`rank`); // FTS5 提供的相关性排序

关键点说明

- 中英文通用：在创建虚拟表时指定 tokenize='unicode61'，它是 SQLite 内置的支持中英文基本分词的分词器。
- rowid 关联：SQLite 的 FTS 表默认有一个隐式的 rowid。通过将 chunk 表的自增 ID（或隐式的 rowid）与 chunk_fts 的 rowid 关联，可以实现高效检索。
- Drizzle 局限性：目前的 index() 函数仅支持 B-Tree 索引，不适用于 FTS5 模块。
