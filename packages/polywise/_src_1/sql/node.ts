import { app, system } from '../consts'
import { node_select_fields } from './fragments'

/**
 * Creates a new node in the graph.
 * Role: Instantiates a new concept or entity within the brain.
 */
export const sql_add_node = `
  INSERT INTO ${app.schema_brain}.nodes (id, label, x, y, threshold, current_threshold, transmitter, embedding, article_ids, lock, is_active)
  VALUES ($1, $2, $3, $4, $5, $5, 1.0, $6, $7, $8, FALSE)
  RETURNING id
`

/**
 * Inserts a new node or updates an existing one, boosting its potential.
 * Role: Ensures a concept exists and reinforces it (learning), triggering activation if it's already present.
 */
export const sql_upsert_node = `
  INSERT INTO ${app.schema_brain}.nodes (id, label, x, y, potential, threshold, current_threshold, transmitter, embedding, article_ids, lock, is_active)
  VALUES ($1, $2, random() * 800, random() * 600, 1.0, ${system.min_threshold}, ${system.min_threshold}, 1.0, $3, $4, $5, FALSE)
  ON CONFLICT (label) DO UPDATE SET 
    potential = LEAST(${app.schema_brain}.nodes.potential + ${system.default_hebbian_reward}, ${system.tick_potential_max}), 
    is_active = CASE WHEN (${app.schema_brain}.nodes.potential + ${system.default_hebbian_reward}) > ${app.schema_brain}.nodes.current_threshold THEN TRUE ELSE ${app.schema_brain}.nodes.is_active END,
    embedding = COALESCE(EXCLUDED.embedding, ${app.schema_brain}.nodes.embedding), 
    article_ids = CASE WHEN EXCLUDED.article_ids IS NOT NULL THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(${app.schema_brain}.nodes.article_ids, '{}') || EXCLUDED.article_ids))) ELSE ${app.schema_brain}.nodes.article_ids END,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id;
`

/**
 * Helper query to find a node ID by label during upsert.
 * Role: Internal check to determine if an insert or update is needed.
 */
export const sql_upsert_node_select = `SELECT id FROM ${app.schema_brain}.nodes WHERE label = $1`

/**
 * Retrieves nodes by their IDs.
 * Role: Gets full node details for a list of node IDs.
 */
export const sql_get_nodes_by_ids = `
  SELECT ${node_select_fields}
  FROM ${app.schema_brain}.nodes
  WHERE id = ANY($1)
`

/**
 * Retrieves all nodes.
 * Role: Full system dump/backup.
 */
export const sql_get_all_nodes = `
  SELECT ${node_select_fields}
  FROM ${app.schema_brain}.nodes
`

/**
 * Updates the vector embedding of a node.
 * Role: Refining the semantic meaning of a concept node.
 */
export const sql_update_node_embedding = `UPDATE ${app.schema_brain}.nodes SET embedding = $1 WHERE id = $2`

/**
 * Finds the node most semantically similar to a query vector.
 * Role: "Grounding" - mapping an abstract vector/thought to a concrete concept node in the graph.
 */
export const sql_find_nearest_node = `
  SELECT id, label, potential, threshold, current_threshold, transmitter, is_active, 1 - (embedding <=> $1) AS similarity
  FROM ${app.schema_brain}.nodes
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1
  LIMIT 1
`
