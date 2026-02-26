import { app } from '../consts'
import { article_select_fields } from './fragments'

/**
 * Inserts a new article into the knowledge base.
 * Role: Ingests raw textual knowledge/content into the system.
 */
export const sql_upsert_article = `
WITH updated_row AS (
UPDATE ${app.db.schema_memory}.articles
SET content = $2, root_ids = COALESCE($3, root_ids), idol_id = COALESCE($4, idol_id), context_id = COALESCE($5, context_id), metadata = COALESCE($6, metadata), updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING ${article_select_fields}, idol_id, root_ids
),
inserted_row AS (
INSERT INTO ${app.db.schema_memory}.articles (id, content, root_ids, idol_id, context_id, metadata)
SELECT $1, $2, $3, $4, COALESCE($5, 'global'), $6
WHERE NOT EXISTS (SELECT 1 FROM updated_row)
RETURNING ${article_select_fields}, idol_id, root_ids
)
SELECT * FROM updated_row
UNION ALL
SELECT * FROM inserted_row
`

/**
 * Retrieves the full content of a single article.
 * Role: Reading the actual text after a search result.
 */
export const sql_get_article = `
SELECT ${article_select_fields}, root_ids, idol_id, context_id
FROM ${app.db.schema_memory}.articles
WHERE id = $1
AND ($2::text[] IS NULL OR root_ids && $2::text[])
AND ($3::text IS NULL OR idol_id = $3)
AND ($4::text IS NULL OR context_id = $4)
`
/**
 * Retrieves articles by ids (full fields).
 * Role: Bulk export or maintenance listing.
 */
export const sql_get_articles_by_ids = `
SELECT ${article_select_fields}, root_ids, idol_id, context_id
FROM ${app.db.schema_memory}.articles
WHERE id = ANY($1::text[])
AND ($2::text[] IS NULL OR root_ids && $2::text[])
AND ($3::text IS NULL OR idol_id = $3)
AND ($4::text IS NULL OR context_id = $4)
`

/**
 * Updates article metadata.
 * Role: Persists source confidence and conflict monitoring signals.
 */
export const sql_update_article_metadata = `
UPDATE ${app.db.schema_memory}.articles
SET metadata = $2,
updated_at = CURRENT_TIMESTAMP
WHERE id = $1
`

/**
 * Deletes an article and its associated embedding (via CASCADE) with filter validation.
 * Role: Removes a memory and all related data including node_sources references with security filtering.
 */
export const sql_delete_article = `
DELETE FROM ${app.db.schema_memory}.articles
WHERE id = ANY($1::text[])
AND ($2::text[] IS NULL OR root_ids && $2::text[])
AND ($3::text IS NULL OR idol_id = $3)
AND ($4::text IS NULL OR context_id = $4)
`

/**
 * Retrieves the stored embedding for an article.
 * Role: Used for re-indexing or analysis.
 */
export const sql_get_article_embedding = `
SELECT embedding
FROM ${app.db.schema_memory}.article_embeddings
WHERE id = ANY($1::text[])
AND ($2::text[] IS NULL OR root_ids && $2::text[])
AND ($3::text IS NULL OR idol_id = $3)
AND ($4::text IS NULL OR context_id = $4)
`

/**
 * Stores the vector embedding for an article.
 * Role: Enables semantic search by mapping article content to a vector space.
 */
export const sql_upsert_article_embedding = `
INSERT INTO ${app.db.schema_memory}.article_embeddings (
id,
article_id,
embedding
)
VALUES ($1, $2, $3)
ON CONFLICT (article_id)
DO UPDATE SET
embedding = EXCLUDED.embedding
RETURNING id
`

/**
 * Full-text search on articles.
 * Role: Fast lexical retrieval by natural language query.
 */
export const sql_search_articles_by_text = `
  SELECT ${article_select_fields},
    ts_rank(to_tsvector('english', coalesce(content,'')), websearch_to_tsquery('english', $1)) AS similarity
  FROM ${app.db.schema_memory}.articles
  WHERE to_tsvector('english', coalesce(content,'')) @@ websearch_to_tsquery('english', $1)
    AND ($3::text[] IS NULL OR root_ids && $3)
    AND ($4::text IS NULL OR idol_id = $4)
    AND ($5::text IS NULL OR context_id = $5)
  ORDER BY similarity DESC
  LIMIT $2
`

/**
 * Vector similarity search on article embeddings.
 * Role: Semantic retrieval by meaning instead of exact keywords.
 */
export const sql_search_articles_by_vector = `
  SELECT 
    ${article_select_fields},
    1 - (e.embedding <=> $1) AS similarity
  FROM ${app.db.schema_memory}.articles a
  JOIN ${app.db.schema_memory}.article_embeddings e ON a.id = e.article_id
  WHERE ($3::text[] IS NULL OR a.root_ids && $3)
    AND ($4::text IS NULL OR a.idol_id = $4)
    AND ($5::text IS NULL OR a.context_id = $5)
    AND (1 - (e.embedding <=> $1)) > $6
  ORDER BY e.embedding <=> $1
  LIMIT $2
`
