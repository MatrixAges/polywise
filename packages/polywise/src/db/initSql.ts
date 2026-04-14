import { env } from '@core/env'

export default () => {
	const sql = `
      -- FTS virtual tables
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.link_url_fts USING fts5(url, tokenize='unicode61');
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.chunk_keywords_fts USING fts5(keywords,tokenize='unicode61');

      -- Vector virtual tables
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.agent_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.node_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.edge_vec USING vec0(vectors float[1024]);
      CREATE VIRTUAL TABLE IF NOT EXISTS vec.chunk_vec USING vec0(vectors float[1024]);
      `

	env.sqlite.transaction(() => env.sqlite.exec(sql))()
}
