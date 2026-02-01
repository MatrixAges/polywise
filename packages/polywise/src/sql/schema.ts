export const sql_createSchemaBrain = `CREATE SCHEMA IF NOT EXISTS brain;`

export const sql_createTableNodes = `
  CREATE TABLE IF NOT EXISTS brain.nodes (
    id SERIAL PRIMARY KEY,
    label TEXT UNIQUE,
    x REAL, 
    y REAL,
    potential REAL DEFAULT 0.0,
    activation REAL DEFAULT 0.0, 
    threshold REAL DEFAULT 0.5,
    last_fired_at TIMESTAMP
  );
`

export const sql_createTableEdges = `
  CREATE TABLE IF NOT EXISTS brain.edges (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES brain.nodes(id),
    target_id INTEGER REFERENCES brain.nodes(id),
    weight REAL DEFAULT 0.1,
    distance REAL DEFAULT 1.0,
    type TEXT,
    learning_rate REAL DEFAULT 1.0,
    decay_resistance REAL DEFAULT 1.0
  );
`

export const sql_createIndexEdgeSrc = `CREATE INDEX IF NOT EXISTS idx_edge_src ON brain.edges(source_id);`
export const sql_createIndexEdgeTgt = `CREATE INDEX IF NOT EXISTS idx_edge_tgt ON brain.edges(target_id);`
export const sql_createIndexActiveEdges = `
  CREATE INDEX IF NOT EXISTS idx_active_edges 
  ON brain.edges (source_id, target_id, weight) 
  WHERE weight > 0.1;
`
export const sql_createIndexCoreTruth = `
  CREATE INDEX IF NOT EXISTS idx_core_truth
  ON brain.edges (source_id, target_id)
  WHERE decay_resistance > 1.5;
`

export const sql_createSchemaKnowledge = `CREATE SCHEMA IF NOT EXISTS knowledge;`

export const sql_createTableArticles = `
  CREATE TABLE IF NOT EXISTS knowledge.articles (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_createTableNodeSources = `
  CREATE TABLE IF NOT EXISTS brain.node_sources (
    node_id INTEGER REFERENCES brain.nodes(id),
    article_id INTEGER REFERENCES knowledge.articles(id),
    PRIMARY KEY (node_id, article_id)
  );
`

export const sql_createSchemaUserSpace = `CREATE SCHEMA IF NOT EXISTS user_space;`
