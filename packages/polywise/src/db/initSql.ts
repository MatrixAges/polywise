import { env } from '@core/env'

export default () => {
	const sql = `
      -- FTS 虚表
      CREATE VIRTUAL TABLE IF NOT EXISTS article_url_fts USING fts5(url, tokenize='unicode61');
      CREATE VIRTUAL TABLE IF NOT EXISTS chunk_keywords_fts USING fts5(keywords,tokenize='unicode61');

      -- 向量虚表
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.agent_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.node_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.edge_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.chunk_vec USING vec0(vectors float[1024]);

      -- article url fts 触发器
      CREATE TRIGGER IF NOT EXISTS article_after_insert AFTER INSERT ON article BEGIN
            INSERT INTO article_url_fts(rowid, url) VALUES (new.rowid, new.url);
      END;
      CREATE TRIGGER IF NOT EXISTS article_after_update AFTER UPDATE ON article BEGIN
            UPDATE article_url_fts SET url = new.url WHERE rowid = old.rowid;
      END;
      CREATE TRIGGER IF NOT EXISTS article_after_delete AFTER DELETE ON article BEGIN
            DELETE FROM article_url_fts WHERE rowid = old.rowid;
      END;

      -- chunk keywords fts 触发器
      CREATE TRIGGER IF NOT EXISTS chunk_after_insert AFTER INSERT ON chunk BEGIN
            INSERT INTO chunk_keywords_fts(rowid, keywords) VALUES (new.rowid, new.keywords);
      END;
      CREATE TRIGGER IF NOT EXISTS chunk_after_update AFTER UPDATE ON chunk BEGIN
            UPDATE chunk_keywords_fts SET keywords = new.keywords WHERE rowid = old.rowid;
      END;
      CREATE TRIGGER IF NOT EXISTS chunk_after_delete AFTER DELETE ON chunk BEGIN
            DELETE FROM chunk_keywords_fts WHERE rowid = old.rowid;
      END;
      `

	env.sqlite.transaction(() => env.sqlite.exec(sql))()
}
