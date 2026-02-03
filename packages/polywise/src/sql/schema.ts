import { SCHEMA_BRAIN, SCHEMA_KNOWLEDGE, SCHEMA_USER } from '../consts'

export const sql_create_extension_vector = `CREATE EXTENSION IF NOT EXISTS vector;`

export const sql_create_schema_brain = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_BRAIN};`

export const sql_create_table_nodes = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_BRAIN}.nodes (
    id SERIAL PRIMARY KEY,
    label TEXT UNIQUE,
    x REAL,
    y REAL,
    potential REAL DEFAULT 0.0,
    activation REAL DEFAULT 0.0,
    threshold REAL DEFAULT 0.5,
    last_fired_at TIMESTAMP,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    metrics_ids TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    embedding vector(1024),
    is_action BOOLEAN DEFAULT false
  );
`

export const sql_create_table_edges = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_BRAIN}.edges (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES ${SCHEMA_BRAIN}.nodes(id),
    target_id INTEGER REFERENCES ${SCHEMA_BRAIN}.nodes(id),
    weight REAL DEFAULT 0.1,
    distance REAL DEFAULT 1.0,
    type TEXT,
    learning_rate REAL DEFAULT 1.0,
    decay_resistance REAL DEFAULT 1.0,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    metrics_ids TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_habit BOOLEAN DEFAULT false,
    reaction_count INTEGER DEFAULT 0
  );
`

export const sql_create_index_nodes_embedding = `
  CREATE INDEX IF NOT EXISTS idx_nodes_embedding 
  ON ${SCHEMA_BRAIN}.nodes USING hnsw (embedding vector_cosine_ops);
`

export const sql_create_index_edge_src = `CREATE INDEX IF NOT EXISTS idx_edge_src ON ${SCHEMA_BRAIN}.edges(source_id);`

export const sql_create_index_edge_tgt = `CREATE INDEX IF NOT EXISTS idx_edge_tgt ON ${SCHEMA_BRAIN}.edges(target_id);`

export const sql_create_index_active_edges = `
  CREATE INDEX IF NOT EXISTS idx_active_edges 
  ON ${SCHEMA_BRAIN}.edges (source_id, target_id, weight) 
  WHERE weight > 0.1;
`

export const sql_create_index_core_truth = `
  CREATE INDEX IF NOT EXISTS idx_core_truth
  ON ${SCHEMA_BRAIN}.edges (source_id, target_id)
  WHERE decay_resistance > 1.5;
`

export const sql_create_index_nodes_idol = `CREATE INDEX IF NOT EXISTS idx_nodes_idol ON ${SCHEMA_BRAIN}.nodes(idol_id);`

export const sql_create_index_edges_idol = `CREATE INDEX IF NOT EXISTS idx_edges_idol ON ${SCHEMA_BRAIN}.edges(idol_id);`

export const sql_create_index_nodes_roots = `CREATE INDEX IF NOT EXISTS idx_nodes_roots ON ${SCHEMA_BRAIN}.nodes USING GIN(root_ids);`

export const sql_create_index_edges_roots = `CREATE INDEX IF NOT EXISTS idx_edges_roots ON ${SCHEMA_BRAIN}.edges USING GIN(root_ids);`

export const sql_create_schema_knowledge = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_KNOWLEDGE};`

export const sql_create_table_articles = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_KNOWLEDGE}.articles (
    id SERIAL PRIMARY KEY,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_create_table_node_sources = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_BRAIN}.node_sources (
    node_id INTEGER REFERENCES ${SCHEMA_BRAIN}.nodes(id),
    article_id INTEGER REFERENCES ${SCHEMA_KNOWLEDGE}.articles(id),
    PRIMARY KEY (node_id, article_id)
  );
`

export const sql_create_schema_user_space = `CREATE SCHEMA IF NOT EXISTS "${SCHEMA_USER}";`

export const sql_create_table_article_embeddings = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_KNOWLEDGE}.article_embeddings (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES ${SCHEMA_KNOWLEDGE}.articles(id) ON DELETE CASCADE,
    embedding vector(1024) NOT NULL,
    model_name TEXT DEFAULT 'onnx-community/Qwen3-Embedding-0.6B-ONNX',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_create_index_article_embeddings_hnsw = `
  CREATE INDEX IF NOT EXISTS idx_article_embeddings_hnsw 
  ON ${SCHEMA_KNOWLEDGE}.article_embeddings USING hnsw (embedding vector_cosine_ops);
`

export const sql_create_index_article_content_gin = `CREATE INDEX IF NOT EXISTS idx_article_content_gin ON ${SCHEMA_KNOWLEDGE}.articles USING GIN(to_tsvector('english', coalesce(content,'')));`
