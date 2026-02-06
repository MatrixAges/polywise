import { SCHEMA_MEMORY } from '../consts'

/**
 * Creates the memory schema.
 * Role: Initializes the namespace for memory-related tables.
 */
export const sql_create_schema_memory = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_MEMORY};`

/**
 * Creates the long-term memory table.
 * Role: Stores persistent semantic and episodic memories with vector embeddings for semantic retrieval.
 */
export const sql_create_table_long_term = `
CREATE TABLE IF NOT EXISTS ${SCHEMA_MEMORY}.long_term (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1024),
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    frequency INTEGER DEFAULT 1,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    metrics_ids TEXT[] DEFAULT '{}'
);`

/**
 * Updates the access frequency and timestamp of a memory.
 * Role: Reinforces frequently accessed memories, protecting them from decay (forgetting).
 */
export const sql_update_long_term_frequency = `
UPDATE ${SCHEMA_MEMORY}.long_term 
SET frequency = frequency + 1, last_accessed_at = CURRENT_TIMESTAMP
WHERE id = $1;`

/**
 * Updates the content and embedding of a specific memory.
 * Role: Implements memory reconsolidation, allowing memories to evolve or be corrected over time.
 */
export const sql_update_long_term_content = `
UPDATE ${SCHEMA_MEMORY}.long_term
SET content = $1, embedding = $2, last_accessed_at = CURRENT_TIMESTAMP
WHERE id = $3;`

/**
 * Finds the most semantically similar memory.
 * Role: Content-addressable retrieval to check if a memory already exists (deduplication or reinforcement).
 */
export const sql_find_similar_long_term = `
SELECT id, content, (1 - (embedding <=> $1)) as similarity
FROM ${SCHEMA_MEMORY}.long_term
WHERE (1 - (embedding <=> $1)) > $2
ORDER BY similarity DESC
LIMIT 1;`

/**
 * Inserts a new memory or updates an existing one if ID conflicts.
 * Role: Flexible storage mechanism for ensuring information is saved or refreshed.
 */
export const sql_upsert_long_term = `
INSERT INTO ${SCHEMA_MEMORY}.long_term (content, embedding, idol_id, root_ids, metrics_ids)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE SET 
    content = EXCLUDED.content,
    frequency = ${SCHEMA_MEMORY}.long_term.frequency + 1,
    root_ids = (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(${SCHEMA_MEMORY}.long_term.root_ids, '{}') || EXCLUDED.root_ids))),
    metrics_ids = (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(${SCHEMA_MEMORY}.long_term.metrics_ids, '{}') || EXCLUDED.metrics_ids))),
    last_accessed_at = CURRENT_TIMESTAMP;`

/**
 * Creates the diary table.
 * Role: Stores sequential, timestamped logs of system thoughts and states (stream of consciousness/episodic log).
 */
export const sql_create_table_diary = `
CREATE TABLE IF NOT EXISTS ${SCHEMA_MEMORY}.diary (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1024),
    timestamp TIMESTAMP NOT NULL,
    idol_id TEXT,
    root_ids TEXT[] DEFAULT '{}',
    metrics_ids TEXT[] DEFAULT '{}'
);`

/**
 * Creates an HNSW index on long-term memory embeddings.
 * Role: Optimizes vector similarity search performance for large memory banks.
 */
export const sql_create_index_long_term_embedding = `
CREATE INDEX IF NOT EXISTS idx_long_term_embedding ON ${SCHEMA_MEMORY}.long_term 
USING hnsw (embedding vector_cosine_ops);`

/**
 * Creates an HNSW index on diary embeddings.
 * Role: Enables fast semantic search over the episodic history.
 */
export const sql_create_index_diary_embedding = `
CREATE INDEX IF NOT EXISTS idx_diary_embedding ON ${SCHEMA_MEMORY}.diary 
USING hnsw (embedding vector_cosine_ops);`

/**
 * Creates an index on diary timestamps.
 * Role: Optimizes time-based retrieval of episodic memories (e.g., "what happened yesterday?").
 */
export const sql_create_index_diary_timestamp = `
CREATE INDEX IF NOT EXISTS idx_diary_timestamp ON ${SCHEMA_MEMORY}.diary(timestamp);`

/**
 * Retrieves memories filtered by metadata, sorted by recency.
 * Role: Context retrieval for specific idols or roots.
 */
export const sql_get_long_memory = `
SELECT content FROM ${SCHEMA_MEMORY}.long_term 
WHERE ($1::TEXT IS NULL OR idol_id = $1)
AND ($2::TEXT[] IS NULL OR root_ids && $2)
AND ($3::TEXT[] IS NULL OR metrics_ids && $3)
ORDER BY last_accessed_at DESC;`

/**
 * Updates the last accessed timestamp for a batch of memories.
 * Role: Refreshes memories based on context matches without retrieving content.
 */
export const sql_update_long_term_access = `
UPDATE ${SCHEMA_MEMORY}.long_term SET last_accessed_at = CURRENT_TIMESTAMP 
WHERE ($1::TEXT IS NULL OR idol_id = $1)
AND ($2::TEXT[] IS NULL OR root_ids && $2)
AND ($3::TEXT[] IS NULL OR metrics_ids && $3);`

/**
 * Inserts a new long-term memory.
 * Role: Basic storage of new facts or experiences.
 */
export const sql_insert_long_term = `
INSERT INTO ${SCHEMA_MEMORY}.long_term (content, embedding, idol_id, root_ids, metrics_ids)
VALUES ($1, $2, $3, $4, $5);`

/**
 * Counts the total number of long-term memories.
 * Role: System monitoring and capacity planning.
 */
export const sql_get_long_term_count = `
SELECT count(*) as count FROM ${SCHEMA_MEMORY}.long_term;`

// S = frequency * exp(-lambda * (now - last_accessed_at_in_days))
/**
 * Deletes the least useful memory based on frequency and recency.
 * Role: Implements a forgetting mechanism based on the Ebbinghaus forgetting curve to manage capacity.
 */
export const sql_delete_decayed_long_term = `
DELETE FROM ${SCHEMA_MEMORY}.long_term 
WHERE id = (
    SELECT id 
    FROM ${SCHEMA_MEMORY}.long_term 
    ORDER BY (frequency * exp(-$1 * EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_accessed_at)) / 86400.0)) ASC 
    LIMIT 1
);`

/**
 * Retrieves a specific diary entry by timestamp and metadata.
 * Role: Precise lookup of a past state.
 */
export const sql_get_diary = `
SELECT * FROM ${SCHEMA_MEMORY}.diary 
WHERE timestamp = $1
AND ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4);`

/**
 * Retrieves the diary entry immediately preceding a timestamp.
 * Role: Narrative reconstruction (what happened before X?).
 */
export const sql_get_prev_diary = `
SELECT * FROM ${SCHEMA_MEMORY}.diary 
WHERE timestamp < $1
AND ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY timestamp DESC LIMIT 1;`

/**
 * Retrieves the diary entry immediately following a timestamp.
 * Role: Narrative reconstruction (what happened after X?).
 */
export const sql_get_next_diary = `
SELECT * FROM ${SCHEMA_MEMORY}.diary 
WHERE timestamp > $1
AND ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY timestamp ASC LIMIT 1;`

/**
 * Inserts a new diary entry.
 * Role: Records a snapshot of the current thought process or event.
 */
export const sql_insert_diary = `
INSERT INTO ${SCHEMA_MEMORY}.diary (content, embedding, timestamp, idol_id, root_ids, metrics_ids)
VALUES ($1, $2, $3, $4, $5, $6);`

/**
 * Searches long-term memory by semantic similarity.
 * Role: Core retrieval mechanism for finding relevant knowledge based on meaning.
 */
export const sql_search_long_term = `
SELECT id, content, last_accessed_at, (1 - (embedding <=> $1)) as similarity, idol_id, root_ids, metrics_ids
FROM ${SCHEMA_MEMORY}.long_term
WHERE ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY similarity DESC LIMIT $5;`

/**
 * Searches diary entries by semantic similarity.
 * Role: Retrieving relevant past experiences based on current context.
 */
export const sql_search_diary = `
SELECT id, content, timestamp, (1 - (embedding <=> $1)) as similarity, idol_id, root_ids, metrics_ids
FROM ${SCHEMA_MEMORY}.diary
WHERE ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY similarity DESC LIMIT $5;`
