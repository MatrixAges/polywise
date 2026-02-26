import { app } from '../consts'

/**
 * Finds nearest contexts by embedding similarity.
 * Role: Context routing and session/topic disambiguation.
 */
export const sql_find_nearest_contexts = `
  SELECT id, 1 - (embedding <=> $1) AS similarity
  FROM ${app.db.schema_memory}.contexts
  ORDER BY embedding <=> $1
  LIMIT $2
`

/**
 * Inserts a new context.
 * Role: Creates a fresh semantic context container.
 */
export const sql_insert_context = `
  INSERT INTO ${app.db.schema_memory}.contexts (id, embedding, keywords, usage_count)
  VALUES ($1, $2, $3, $4)
`

/**
 * Updates context embedding/keywords and increases usage count.
 * Role: Keeps context representation adaptive over time.
 */
export const sql_update_context = `
  UPDATE ${app.db.schema_memory}.contexts
  SET embedding = $2,
      keywords = COALESCE($3, keywords),
      usage_count = usage_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
`

/**
 * Upserts transition edge between contexts.
 * Role: Learns navigation pattern from one context to another.
 */
export const sql_upsert_context_edge = `
  INSERT INTO ${app.db.schema_memory}.context_edges (source_id, target_id, weight)
  VALUES ($1, $2, 1.0)
  ON CONFLICT (source_id, target_id) DO UPDATE SET
    weight = ${app.db.schema_memory}.context_edges.weight + 1.0,
    updated_at = CURRENT_TIMESTAMP
`

/**
 * Gets most likely next context from current context.
 * Role: Predictive context switching.
 */
export const sql_get_next_context = `
  SELECT target_id, weight
  FROM ${app.db.schema_memory}.context_edges
  WHERE source_id = $1
  ORDER BY weight DESC, updated_at DESC
  LIMIT 1
`

/**
 * Gets top outgoing context edges for a source context.
 * Role: Context recommendation / graph traversal.
 */
export const sql_get_context_edges_by_source = `
  SELECT target_id, weight, updated_at
  FROM ${app.db.schema_memory}.context_edges
  WHERE source_id = $1
  ORDER BY weight DESC, updated_at DESC
  LIMIT $2
`
