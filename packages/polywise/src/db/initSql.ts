import { env } from '@core/env'

export default () => {
	const sql = `
      DROP TABLE IF EXISTS vec.node_vec;
      DROP TABLE IF EXISTS vec.edge_vec;

      -- FTS virtual tables
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.link_url_fts USING fts5(url, tokenize='unicode61');
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.chunk_keywords_fts USING fts5(keywords,tokenize='unicode61');
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.node_name_fts USING fts5(name, tokenize='unicode61');
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.edge_text_fts USING fts5(text, tokenize='unicode61');

      -- Vector virtual tables
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.agent_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.chunk_vec USING vec0(vectors float[1024]);
      `

	env.sqlite.transaction(() => {
		env.sqlite.exec(sql)
		env.sqlite.exec(`
			DELETE FROM vec.node_name_fts
			WHERE rowid NOT IN (SELECT rowid FROM node);

			INSERT INTO vec.node_name_fts(rowid, name)
			SELECT n.rowid, n.name
			FROM node n
			WHERE NOT EXISTS (SELECT 1 FROM vec.node_name_fts f WHERE f.rowid = n.rowid);

			DELETE FROM vec.edge_text_fts
			WHERE rowid NOT IN (SELECT rowid FROM edge);

			INSERT INTO vec.edge_text_fts(rowid, text)
			SELECT
				e.rowid,
				trim(coalesce(source_node.name, '') || ' ' || coalesce(e.relation, '') || ' ' || coalesce(target_node.name, ''))
			FROM edge e
			LEFT JOIN node source_node ON source_node.id = e.source_id
			LEFT JOIN node target_node ON target_node.id = e.target_id
			WHERE NOT EXISTS (SELECT 1 FROM vec.edge_text_fts f WHERE f.rowid = e.rowid);
		`)
	})()
}
