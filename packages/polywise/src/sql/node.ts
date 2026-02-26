import { app, system } from '../consts'
import { node_select_fields } from './fragments'

/**
 * Creates a new node in the graph.
 * Role: Instantiates a new concept or entity within the brain.
 */
export const sql_add_node = `
  INSERT INTO ${app.db.schema_brain}.nodes (id, label, x, y, threshold, current_threshold, transmitter, idol_id, root_ids, context_id, embedding, article_ids, lock, is_active)
  VALUES ($1, $2, $3, $4, $5, $5, 1.0, $6, $7, COALESCE($8, 'global'), $9, $10, $11, FALSE)
  RETURNING id
`

/**
 * Inserts a new node or updates an existing one, boosting its potential.
 * Role: Ensures a concept exists and reinforces it (learning), triggering activation if it's already present.
 */
export const sql_upsert_node = `
  INSERT INTO ${app.db.schema_brain}.nodes (id, label, x, y, potential, threshold, current_threshold, transmitter, idol_id, root_ids, context_id, embedding, article_ids, lock, is_active)
  VALUES ($1, $2, random() * 800, random() * 600, 1.0, ${system.shy.min_threshold}, ${system.shy.min_threshold}, 1.0, $3, $4, COALESCE($5, 'global'), $6, $7, $8, FALSE)
  ON CONFLICT (label, context_id) DO UPDATE SET 
    potential = LEAST(${app.db.schema_brain}.nodes.potential + ${system.default_config.default_hebbian_reward}, ${system.tick.tick_potential_max}), 
    is_active = CASE WHEN (${app.db.schema_brain}.nodes.potential + ${system.default_config.default_hebbian_reward}) > ${app.db.schema_brain}.nodes.current_threshold THEN TRUE ELSE ${app.db.schema_brain}.nodes.is_active END,
    embedding = COALESCE(EXCLUDED.embedding, ${app.db.schema_brain}.nodes.embedding), 
    idol_id = COALESCE(EXCLUDED.idol_id, ${app.db.schema_brain}.nodes.idol_id),
    root_ids = CASE WHEN EXCLUDED.root_ids IS NOT NULL THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(${app.db.schema_brain}.nodes.root_ids, '{}') || EXCLUDED.root_ids))) ELSE ${app.db.schema_brain}.nodes.root_ids END,
    context_id = COALESCE(EXCLUDED.context_id, ${app.db.schema_brain}.nodes.context_id),
    article_ids = CASE WHEN EXCLUDED.article_ids IS NOT NULL THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(${app.db.schema_brain}.nodes.article_ids, '{}') || EXCLUDED.article_ids))) ELSE ${app.db.schema_brain}.nodes.article_ids END,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id;
`

/**
 * Helper query to find a node ID by label during upsert.
 * Role: Internal check to determine if an insert or update is needed.
 */
export const sql_upsert_node_select = `SELECT id FROM ${app.db.schema_brain}.nodes WHERE label = $1`

/**
 * Retrieves nodes by their IDs.
 * Role: Gets full node details for a list of node IDs.
 */
export const sql_get_nodes_by_ids = `
  SELECT ${node_select_fields}
  FROM ${app.db.schema_brain}.nodes
  WHERE id = ANY($1)
`

/**
 * Retrieves all nodes.
 * Role: Full system dump/backup.
 */
export const sql_get_all_nodes = `
  SELECT ${node_select_fields}
  FROM ${app.db.schema_brain}.nodes
`

/**
 * Updates the vector embedding of a node.
 * Role: Refining the semantic meaning of a concept node.
 */
export const sql_update_node_embedding = `UPDATE ${app.db.schema_brain}.nodes SET embedding = $1 WHERE id = $2`

/**
 * Finds the node most semantically similar to a query vector.
 * Role: "Grounding" - mapping an abstract vector/thought to a concrete concept node in the graph.
 */
export const sql_find_nearest_node = `
  SELECT id, label, potential, threshold, current_threshold, transmitter, is_active, 1 - (embedding <=> $1) AS similarity
  FROM ${app.db.schema_brain}.nodes
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1
  LIMIT 1
`
