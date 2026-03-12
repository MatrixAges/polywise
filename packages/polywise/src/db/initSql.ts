import { env } from '@core/env'

export default () => {
	const sql = `
      -- FTS 虚表
      CREATE VIRTUAL TABLE IF NOT EXISTS chunk_fts USING fts5(keywords,tokenize='unicode61');

      -- 向量虚表
      CREATE VIRTUAL TABLE IF NOT EXISTS agent_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS node_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS edge_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS chunk_vec USING vec0(vectors float[1024]);

      -- 触发器：插入同步
      CREATE TRIGGER IF NOT EXISTS chunk_after_insert AFTER INSERT ON chunk BEGIN
            INSERT INTO chunk_fts(rowid, keywords) VALUES (new.rowid, new.keywords);
      END;

      -- 触发器：更新同步
      CREATE TRIGGER IF NOT EXISTS chunk_after_update AFTER UPDATE ON chunk BEGIN
            UPDATE chunk_fts SET keywords = new.keywords WHERE rowid = old.rowid;
      END;

      -- 触发器：删除同步
      CREATE TRIGGER IF NOT EXISTS chunk_after_delete AFTER DELETE ON chunk BEGIN
            DELETE FROM chunk_fts WHERE rowid = old.rowid;
      END;
      `

	env.sqlite.transaction(() => env.sqlite.exec(sql))()
}
