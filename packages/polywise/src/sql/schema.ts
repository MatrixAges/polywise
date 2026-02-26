import { app } from '../consts'

/**
 * Enables the pgvector extension.
 * Role: Provides native vector storage and similarity search capabilities (L2 distance, cosine similarity, inner product).
 */
export const sql_create_extension_vector = `CREATE EXTENSION IF NOT EXISTS vector;`

/**
 * Creates the brain schema.
 * Role: Initializes the namespace for neural graph data (nodes, edges).
 */
export const sql_create_schema_brain = `CREATE SCHEMA IF NOT EXISTS ${app.db.schema_brain};`

/**
 * Creates the knowledge schema.
 * Role: Initializes namespace for raw knowledge/documents.
 */
export const sql_create_schema_memory = `CREATE SCHEMA IF NOT EXISTS ${app.db.schema_memory};`

/**
 * Creates the user space schema.
 * Role: Initializes namespace for user-specific data.
 */
export const sql_create_schema_user_space = `CREATE SCHEMA IF NOT EXISTS "${app.db.schema_user}";`

/**
 * Creates the nodes table.
 * Role: Stores the fundamental units of the knowledge graph (concepts, entities).
 * Columns:
 * - potential: Current excitation level.
 * - threshold: Activation threshold.
 * - embedding: Semantic vector representation.
 * - is_action: Whether this node represents an executable action.
 */
export const sql_create_table_nodes = `
  CREATE TABLE IF NOT EXISTS ${app.db.schema_brain}.nodes (
    id TEXT PRIMARY KEY,
    label TEXT,
    x REAL,
    y REAL,
    potential REAL DEFAULT 1.0,
    threshold REAL DEFAULT 0.5,
    current_threshold REAL DEFAULT 0.5,
    transmitter REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT FALSE,
    last_fired_at TIMESTAMP,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    context_id TEXT DEFAULT 'global',
    article_ids TEXT[] DEFAULT '{}',
    embedding vector(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lock BOOLEAN DEFAULT FALSE,
    UNIQUE (label, context_id)
  );
`

/**
 * Creates the edges table.
 * Role: Stores the connections between nodes (associations, relationships).
 * Columns:
 * - weight: Strength of the connection (synaptic weight).
 * - distance: Cost of traversal (inverse of weight). Dynamically calculated: distance = 1 / (weight + epsilon).
 * - learning_rate: How quickly this edge adapts (neuroplasticity).
 * - decay_resistance: How resistant this edge is to forgetting.
 */
export const sql_create_table_edges = `
  CREATE TABLE IF NOT EXISTS ${app.db.schema_brain}.edges (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES ${app.db.schema_brain}.nodes(id),
    target_id TEXT REFERENCES ${app.db.schema_brain}.nodes(id),
    weight REAL DEFAULT 0.1,
    distance REAL DEFAULT 1.0,
    learning_rate REAL DEFAULT 1.0,
    decay_resistance REAL DEFAULT 1.0,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    context_id TEXT DEFAULT 'global',
    reaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lock BOOLEAN DEFAULT FALSE
  );
`

/**
 * Creates an HNSW index on node embeddings.
 * Role: Optimizes semantic search for concepts.
 */
export const sql_create_index_nodes_embedding = `
  CREATE INDEX IF NOT EXISTS idx_nodes_embedding 
  ON ${app.db.schema_brain}.nodes USING hnsw (embedding vector_cosine_ops);
`

/**
 * Creates an index on edge source IDs.
 * Role: Optimizes forward traversal (outgoing connections).
 */
export const sql_create_index_edge_src = `CREATE INDEX IF NOT EXISTS idx_edge_src ON ${app.db.schema_brain}.edges(source_id);`

/**
 * Creates an index on edge target IDs.
 * Role: Optimizes backward traversal (incoming connections) and aggregation.
 */
export const sql_create_index_edge_tgt = `CREATE INDEX IF NOT EXISTS idx_edge_tgt ON ${app.db.schema_brain}.edges(target_id);`

/**
 * Creates a partial index on active/strong edges.
 * Role: Optimizes the main simulation loop (tick) by ignoring negligible connections.
 */
export const sql_create_index_active_edges = `
  CREATE INDEX IF NOT EXISTS idx_active_edges 
  ON ${app.db.schema_brain}.edges (source_id, target_id, weight) 
  WHERE weight > 0.1;
`

/**
 * Creates a partial index on "core truth" edges (high decay resistance).
 * Role: Optimizes retrieval of long-term, stable knowledge.
 */
export const sql_create_index_core_truth = `
  CREATE INDEX IF NOT EXISTS idx_core_truth
  ON ${app.db.schema_brain}.edges (source_id, target_id)
  WHERE decay_resistance > 1.5;
`

/**
 * Creates an index on node Idol IDs.
 * Role: Optimizes context-scoped node retrieval.
 */
export const sql_create_index_nodes_idol = `CREATE INDEX IF NOT EXISTS idx_nodes_idol ON ${app.db.schema_brain}.nodes(idol_id);`

/**
 * Creates an index on edge Idol IDs.
 * Role: Optimizes context-scoped edge retrieval.
 */
export const sql_create_index_edges_idol = `CREATE INDEX IF NOT EXISTS idx_edges_idol ON ${app.db.schema_brain}.edges(idol_id);`

/**
 * Creates a GIN index on node Root IDs array.
 * Role: Optimizes group/hierarchy-based node retrieval.
 */
export const sql_create_index_nodes_roots = `CREATE INDEX IF NOT EXISTS idx_nodes_roots ON ${app.db.schema_brain}.nodes USING GIN(root_ids);`

/**
 * Creates an index on node context_id.
 * Role: Optimizes context-based node retrieval.
 */
export const sql_create_index_nodes_context = `CREATE INDEX IF NOT EXISTS idx_nodes_context ON ${app.db.schema_brain}.nodes (context_id);`

/**
 * Creates a GIN index on edge Root IDs array.
 * Role: Optimizes group/hierarchy-based edge retrieval.
 */
export const sql_create_index_edges_roots = `CREATE INDEX IF NOT EXISTS idx_edges_roots ON ${app.db.schema_brain}.edges USING GIN(root_ids);`

/**
 * Creates an index on edge context_id.
 * Role: Optimizes context-based edge retrieval.
 */
export const sql_create_index_edges_context = `CREATE INDEX IF NOT EXISTS idx_edges_context ON ${app.db.schema_brain}.edges (context_id);`

/**
 * Creates the articles table.
 * Role: Stores source documents, articles, or raw text chunks.
 */
export const sql_create_table_articles = `
  CREATE TABLE IF NOT EXISTS ${app.db.schema_memory}.articles (
    id TEXT PRIMARY KEY,
    content TEXT,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    context_id TEXT DEFAULT 'global',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Creates the contexts table.
 * Role: Stores episodic context embeddings for context resolution and retrieval gating.
 */
export const sql_create_table_contexts = `
  CREATE TABLE IF NOT EXISTS ${app.db.schema_memory}.contexts (
    id TEXT PRIMARY KEY,
    embedding vector(1024) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Creates the context_edges table.
 * Role: Tracks sequential transitions between episodic contexts.
 */
export const sql_create_table_context_edges = `
  CREATE TABLE IF NOT EXISTS ${app.db.schema_memory}.context_edges (
    source_id TEXT REFERENCES ${app.db.schema_memory}.contexts(id),
    target_id TEXT REFERENCES ${app.db.schema_memory}.contexts(id),
    weight REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_id, target_id)
  );
`

/**
 * Creates the node_sources link table.
 * Role: Many-to-many relationship mapping nodes back to the articles that defined them.
 */
export const sql_create_table_node_sources = `
  CREATE TABLE IF NOT EXISTS ${app.db.schema_brain}.node_sources (
    node_id TEXT REFERENCES ${app.db.schema_brain}.nodes(id),
    article_id TEXT REFERENCES ${app.db.schema_memory}.articles(id) ON DELETE CASCADE,
    PRIMARY KEY (node_id, article_id)
  );
`

/**
 * Creates the article embeddings table.
 * Role: Separates large vector data from article content for better storage management.
 */
export const sql_create_table_article_embeddings = `
  CREATE TABLE IF NOT EXISTS ${app.db.schema_memory}.article_embeddings (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES ${app.db.schema_memory}.articles(id) ON DELETE CASCADE,
    embedding vector(1024) NOT NULL,
    model_name TEXT DEFAULT 'onnx-community/Qwen3-Embedding-0.6B-ONNX',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Creates an HNSW index on context embeddings.
 * Role: Optimizes episodic context similarity search.
 */
export const sql_create_index_contexts_embedding = `
  CREATE INDEX IF NOT EXISTS idx_contexts_embedding_hnsw 
  ON ${app.db.schema_memory}.contexts USING hnsw (embedding vector_cosine_ops);
`

/**
 * Creates an index on context_edges source.
 * Role: Optimizes context transition lookups.
 */
export const sql_create_index_context_edges_source = `
  CREATE INDEX IF NOT EXISTS idx_context_edges_source
  ON ${app.db.schema_memory}.context_edges (source_id);
`

/**
 * Creates an HNSW index on article embeddings.
 * Role: Optimizes semantic search for documents (RAG).
 */
export const sql_create_index_article_embeddings_hnsw = `
  CREATE INDEX IF NOT EXISTS idx_article_embeddings_hnsw 
  ON ${app.db.schema_memory}.article_embeddings USING hnsw (embedding vector_cosine_ops);
`

/**
 * Creates a GIN index on article content for full-text search.
 * Role: Optimizes standard keyword-based search.
 */
export const sql_create_index_article_content_gin = `CREATE INDEX IF NOT EXISTS idx_article_content_gin ON ${app.db.schema_memory}.articles USING GIN(to_tsvector('english', coalesce(content,'')));`
