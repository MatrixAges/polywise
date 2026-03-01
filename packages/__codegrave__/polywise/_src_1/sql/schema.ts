import { app } from '../consts'

export const sql_create_extension_vector = `CREATE EXTENSION IF NOT EXISTS vector;`
export const sql_create_schema_brain = `CREATE SCHEMA IF NOT EXISTS ${app.schema_brain};`
export const sql_create_schema_memory = `CREATE SCHEMA IF NOT EXISTS ${app.schema_memory};`
export const sql_create_schema_user_space = `CREATE SCHEMA IF NOT EXISTS "${app.schema_user}";`

export const sql_create_table_nodes = `
  CREATE TABLE IF NOT EXISTS ${app.schema_brain}.nodes (
    id TEXT PRIMARY KEY,
    context_id TEXT,
    label TEXT,
    x REAL,
    y REAL,
    potential REAL DEFAULT 1.0,
    threshold REAL DEFAULT 0.5,
    current_threshold REAL DEFAULT 0.5,
    transmitter REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT FALSE,
    last_fired_at TIMESTAMP,
    article_ids TEXT[] DEFAULT '{}',
    embedding vector(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lock BOOLEAN DEFAULT FALSE,
    UNIQUE (label)
  );
`

export const sql_create_table_edges = `
  CREATE TABLE IF NOT EXISTS ${app.schema_brain}.edges (
    id TEXT PRIMARY KEY,
    context_id TEXT,
    source_id TEXT REFERENCES ${app.schema_brain}.nodes(id),
    target_id TEXT REFERENCES ${app.schema_brain}.nodes(id),
    weight REAL DEFAULT 0.1,
    distance REAL DEFAULT 1.0,
    learning_rate REAL DEFAULT 1.0,
    decay_resistance REAL DEFAULT 1.0,
    reaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lock BOOLEAN DEFAULT FALSE
  );
`

export const sql_create_index_nodes_embedding = `
  CREATE INDEX IF NOT EXISTS idx_nodes_embedding 
  ON ${app.schema_brain}.nodes USING hnsw (embedding vector_cosine_ops);
`

export const sql_create_index_edge_src = `CREATE INDEX IF NOT EXISTS idx_edge_src ON ${app.schema_brain}.edges(source_id);`
export const sql_create_index_edge_tgt = `CREATE INDEX IF NOT EXISTS idx_edge_tgt ON ${app.schema_brain}.edges(target_id);`

export const sql_create_index_active_edges = `
  CREATE INDEX IF NOT EXISTS idx_active_edges 
  ON ${app.schema_brain}.edges (source_id, target_id, weight) 
  WHERE weight > 0.1;
`

export const sql_create_index_core_truth = `
  CREATE INDEX IF NOT EXISTS idx_core_truth
  ON ${app.schema_brain}.edges (source_id, target_id)
  WHERE decay_resistance > 1.5;
`

export const sql_create_table_articles = `
  CREATE TABLE IF NOT EXISTS ${app.schema_memory}.articles (
    id TEXT PRIMARY KEY,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_create_table_contexts = `
  CREATE TABLE IF NOT EXISTS ${app.schema_memory}.contexts (
    id TEXT PRIMARY KEY,
    embedding vector(1024) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_create_table_context_edges = `
  CREATE TABLE IF NOT EXISTS ${app.schema_memory}.context_edges (
    source_id TEXT REFERENCES ${app.schema_memory}.contexts(id),
    target_id TEXT REFERENCES ${app.schema_memory}.contexts(id),
    weight REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_id, target_id)
  );
`

export const sql_create_table_node_sources = `
  CREATE TABLE IF NOT EXISTS ${app.schema_brain}.node_sources (
    node_id TEXT REFERENCES ${app.schema_brain}.nodes(id),
    article_id TEXT REFERENCES ${app.schema_memory}.articles(id) ON DELETE CASCADE,
    PRIMARY KEY (node_id, article_id)
  );
`

export const sql_create_table_article_embeddings = `
  CREATE TABLE IF NOT EXISTS ${app.schema_memory}.article_embeddings (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES ${app.schema_memory}.articles(id) ON DELETE CASCADE,
    embedding vector(1024) NOT NULL,
    model_name TEXT DEFAULT 'onnx-community/Qwen3-Embedding-0.6B-ONNX',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_create_index_contexts_embedding = `
  CREATE INDEX IF NOT EXISTS idx_contexts_embedding_hnsw 
  ON ${app.schema_memory}.contexts USING hnsw (embedding vector_cosine_ops);
`

export const sql_create_index_context_edges_source = `
  CREATE INDEX IF NOT EXISTS idx_context_edges_source
  ON ${app.schema_memory}.context_edges (source_id);
`

export const sql_create_index_article_embeddings_hnsw = `
  CREATE INDEX IF NOT EXISTS idx_article_embeddings_hnsw 
  ON ${app.schema_memory}.article_embeddings USING hnsw (embedding vector_cosine_ops);
`

export const sql_create_index_article_content_gin = `CREATE INDEX IF NOT EXISTS idx_article_content_gin ON ${app.schema_memory}.articles USING GIN(to_tsvector('english', coalesce(content,'')));`
