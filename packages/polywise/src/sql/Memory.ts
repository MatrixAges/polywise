import { SCHEMA_MEMORY } from '../consts'

export const sql_create_schema_memory = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_MEMORY};`

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

export const sql_update_long_term_frequency = `
UPDATE ${SCHEMA_MEMORY}.long_term 
SET frequency = frequency + 1, last_accessed_at = CURRENT_TIMESTAMP
WHERE id = $1;`

export const sql_find_similar_long_term = `
SELECT id, content, (1 - (embedding <=> $1)) as similarity
FROM ${SCHEMA_MEMORY}.long_term
WHERE (1 - (embedding <=> $1)) > $2
ORDER BY similarity DESC
LIMIT 1;`

export const sql_upsert_long_term = `
INSERT INTO ${SCHEMA_MEMORY}.long_term (content, embedding, idol_id, root_ids, metrics_ids)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE SET 
    content = EXCLUDED.content,
    frequency = ${SCHEMA_MEMORY}.long_term.frequency + 1,
    last_accessed_at = CURRENT_TIMESTAMP;`

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

export const sql_create_index_long_term_embedding = `
CREATE INDEX IF NOT EXISTS idx_long_term_embedding ON ${SCHEMA_MEMORY}.long_term 
USING hnsw (embedding vector_cosine_ops);`

export const sql_create_index_diary_embedding = `
CREATE INDEX IF NOT EXISTS idx_diary_embedding ON ${SCHEMA_MEMORY}.diary 
USING hnsw (embedding vector_cosine_ops);`

export const sql_create_index_diary_timestamp = `
CREATE INDEX IF NOT EXISTS idx_diary_timestamp ON ${SCHEMA_MEMORY}.diary(timestamp);`

export const sql_get_long_memory = `
SELECT content FROM ${SCHEMA_MEMORY}.long_term 
WHERE ($1::TEXT IS NULL OR idol_id = $1)
AND ($2::TEXT[] IS NULL OR root_ids && $2)
AND ($3::TEXT[] IS NULL OR metrics_ids && $3)
ORDER BY last_accessed_at DESC;`

export const sql_update_long_term_access = `
UPDATE ${SCHEMA_MEMORY}.long_term SET last_accessed_at = CURRENT_TIMESTAMP 
WHERE ($1::TEXT IS NULL OR idol_id = $1)
AND ($2::TEXT[] IS NULL OR root_ids && $2)
AND ($3::TEXT[] IS NULL OR metrics_ids && $3);`

export const sql_insert_long_term = `
INSERT INTO ${SCHEMA_MEMORY}.long_term (content, embedding, idol_id, root_ids, metrics_ids)
VALUES ($1, $2, $3, $4, $5);`

export const sql_get_long_term_count = `
SELECT count(*) as count FROM ${SCHEMA_MEMORY}.long_term;`

export const sql_delete_oldest_long_term = `
DELETE FROM ${SCHEMA_MEMORY}.long_term 
WHERE id = (SELECT id FROM ${SCHEMA_MEMORY}.long_term ORDER BY last_accessed_at ASC LIMIT 1);`

export const sql_get_diary = `
SELECT * FROM ${SCHEMA_MEMORY}.diary 
WHERE timestamp = $1
AND ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4);`

export const sql_get_prev_diary = `
SELECT * FROM ${SCHEMA_MEMORY}.diary 
WHERE timestamp < $1
AND ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY timestamp DESC LIMIT 1;`

export const sql_get_next_diary = `
SELECT * FROM ${SCHEMA_MEMORY}.diary 
WHERE timestamp > $1
AND ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY timestamp ASC LIMIT 1;`

export const sql_insert_diary = `
INSERT INTO ${SCHEMA_MEMORY}.diary (content, embedding, timestamp, idol_id, root_ids, metrics_ids)
VALUES ($1, $2, $3, $4, $5, $6);`

export const sql_search_long_term = `
SELECT id, content, last_accessed_at, (1 - (embedding <=> $1)) as similarity, idol_id, root_ids, metrics_ids
FROM ${SCHEMA_MEMORY}.long_term
WHERE ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY similarity DESC LIMIT $5;`

export const sql_search_diary = `
SELECT id, content, timestamp, (1 - (embedding <=> $1)) as similarity, idol_id, root_ids, metrics_ids
FROM ${SCHEMA_MEMORY}.diary
WHERE ($2::TEXT IS NULL OR idol_id = $2)
AND ($3::TEXT[] IS NULL OR root_ids && $3)
AND ($4::TEXT[] IS NULL OR metrics_ids && $4)
ORDER BY similarity DESC LIMIT $5;`
