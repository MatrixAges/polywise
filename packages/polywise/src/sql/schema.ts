import { SCHEMA_BRAIN, SCHEMA_MEMORY, SCHEMA_USER } from '../consts'

/**
 * Enables the pgvector extension.
 * Role: Provides native vector storage and similarity search capabilities (L2 distance, cosine similarity, inner product).
 */
export const sql_create_extension_vector = `CREATE EXTENSION IF NOT EXISTS vector;`

/**
 * Creates the brain schema.
 * Role: Initializes the namespace for neural graph data (nodes, edges).
 */
export const sql_create_schema_brain = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_BRAIN};`

/**
 * Creates the nodes table.
 * Role: Stores the fundamental units of the knowledge graph (concepts, entities).
 * Columns:
 * - potential: Current excitation level.
 * - activation: Firing state (0 or 1).
 * - threshold: Activation threshold.
 * - embedding: Semantic vector representation.
 * - is_action: Whether this node represents an executable action.
 */
export const sql_create_table_nodes = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_BRAIN}.nodes (
    id TEXT PRIMARY KEY,
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
    embedding vector(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Creates the edges table.
 * Role: Stores the connections between nodes (associations, relationships).
 * Columns:
 * - weight: Strength of the connection (synaptic weight).
 * - distance: Cost of traversal (inverse of weight).
 * - learning_rate: How quickly this edge adapts (neuroplasticity).
 * - decay_resistance: How resistant this edge is to forgetting.
 * - is_habit: Whether this edge represents an automatic/reflexive pathway.
 */
export const sql_create_table_edges = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_BRAIN}.edges (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES ${SCHEMA_BRAIN}.nodes(id),
    target_id TEXT REFERENCES ${SCHEMA_BRAIN}.nodes(id),
    weight REAL DEFAULT 0.1,
    distance REAL DEFAULT 1.0,
    type TEXT,
    learning_rate REAL DEFAULT 1.0,
    decay_resistance REAL DEFAULT 1.0,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    metrics_ids TEXT[] DEFAULT '{}',
    reaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Creates an HNSW index on node embeddings.
 * Role: Optimizes semantic search for concepts.
 */
export const sql_create_index_nodes_embedding = `
  CREATE INDEX IF NOT EXISTS idx_nodes_embedding 
  ON ${SCHEMA_BRAIN}.nodes USING hnsw (embedding vector_cosine_ops);
`

/**
 * Creates an index on edge source IDs.
 * Role: Optimizes forward traversal (outgoing connections).
 */
export const sql_create_index_edge_src = `CREATE INDEX IF NOT EXISTS idx_edge_src ON ${SCHEMA_BRAIN}.edges(source_id);`

/**
 * Creates an index on edge target IDs.
 * Role: Optimizes backward traversal (incoming connections) and aggregation.
 */
export const sql_create_index_edge_tgt = `CREATE INDEX IF NOT EXISTS idx_edge_tgt ON ${SCHEMA_BRAIN}.edges(target_id);`

/**
 * Creates a partial index on active/strong edges.
 * Role: Optimizes the main simulation loop (tick) by ignoring negligible connections.
 */
export const sql_create_index_active_edges = `
  CREATE INDEX IF NOT EXISTS idx_active_edges 
  ON ${SCHEMA_BRAIN}.edges (source_id, target_id, weight) 
  WHERE weight > 0.1;
`

/**
 * Creates a partial index on "core truth" edges (high decay resistance).
 * Role: Optimizes retrieval of long-term, stable knowledge.
 */
export const sql_create_index_core_truth = `
  CREATE INDEX IF NOT EXISTS idx_core_truth
  ON ${SCHEMA_BRAIN}.edges (source_id, target_id)
  WHERE decay_resistance > 1.5;
`

/**
 * Creates an index on node Idol IDs.
 * Role: Optimizes context-scoped node retrieval.
 */
export const sql_create_index_nodes_idol = `CREATE INDEX IF NOT EXISTS idx_nodes_idol ON ${SCHEMA_BRAIN}.nodes(idol_id);`

/**
 * Creates an index on edge Idol IDs.
 * Role: Optimizes context-scoped edge retrieval.
 */
export const sql_create_index_edges_idol = `CREATE INDEX IF NOT EXISTS idx_edges_idol ON ${SCHEMA_BRAIN}.edges(idol_id);`

/**
 * Creates a GIN index on node Root IDs array.
 * Role: Optimizes group/hierarchy-based node retrieval.
 */
export const sql_create_index_nodes_roots = `CREATE INDEX IF NOT EXISTS idx_nodes_roots ON ${SCHEMA_BRAIN}.nodes USING GIN(root_ids);`

/**
 * Creates a GIN index on edge Root IDs array.
 * Role: Optimizes group/hierarchy-based edge retrieval.
 */
export const sql_create_index_edges_roots = `CREATE INDEX IF NOT EXISTS idx_edges_roots ON ${SCHEMA_BRAIN}.edges USING GIN(root_ids);`

/**
 * Creates the knowledge schema.
 * Role: Initializes namespace for raw knowledge/documents.
 */
export const sql_create_schema_memory = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_MEMORY};`

/**
 * Creates the articles table.
 * Role: Stores source documents, articles, or raw text chunks.
 */
export const sql_create_table_articles = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_MEMORY}.articles (
    id TEXT PRIMARY KEY,
    content TEXT,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    metrics_ids TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Creates the node_sources link table.
 * Role: Many-to-many relationship mapping nodes back to the articles that defined them.
 */
export const sql_create_table_node_sources = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_BRAIN}.node_sources (
    node_id TEXT REFERENCES ${SCHEMA_BRAIN}.nodes(id),
    article_id TEXT REFERENCES ${SCHEMA_MEMORY}.articles(id) ON DELETE CASCADE,
    PRIMARY KEY (node_id, article_id)
  );
`

/**
 * Creates the user space schema.
 * Role: Initializes namespace for user-specific data.
 */
export const sql_create_schema_user_space = `CREATE SCHEMA IF NOT EXISTS "${SCHEMA_USER}";`

/**
 * Creates the article embeddings table.
 * Role: Separates large vector data from article content for better storage management.
 */
export const sql_create_table_article_embeddings = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_MEMORY}.article_embeddings (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES ${SCHEMA_MEMORY}.articles(id) ON DELETE CASCADE,
    embedding vector(1024) NOT NULL,
    model_name TEXT DEFAULT 'onnx-community/Qwen3-Embedding-0.6B-ONNX',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Creates an HNSW index on article embeddings.
 * Role: Optimizes semantic search for documents (RAG).
 */
export const sql_create_index_article_embeddings_hnsw = `
  CREATE INDEX IF NOT EXISTS idx_article_embeddings_hnsw 
  ON ${SCHEMA_MEMORY}.article_embeddings USING hnsw (embedding vector_cosine_ops);
`

/**
 * Creates a GIN index on article content for full-text search.
 * Role: Optimizes standard keyword-based search.
 */
export const sql_create_index_article_content_gin = `CREATE INDEX IF NOT EXISTS idx_article_content_gin ON ${SCHEMA_MEMORY}.articles USING GIN(to_tsvector('english', coalesce(content,'')));`
