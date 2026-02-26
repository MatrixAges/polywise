import { app, system } from '../consts'
import { edge_recall_fields, edge_select_fields } from './fragments'

/**
 * Creates a directed edge between two nodes.
 * Role: Establishes a relationship or association between two concepts.
 */
export const sql_connect = `
  INSERT INTO ${app.db.schema_brain}.edges (id, source_id, target_id, weight, idol_id, root_ids, context_id, lock)
  VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'global'), $8)
`

/**
 * Retrieves edges connected to given nodes.
 * Role: Gets all edges that connect to the specified nodes for graph expansion.
 */
export const sql_get_edges_for_nodes = `
  SELECT ${edge_select_fields}
  FROM ${app.db.schema_brain}.edges
  WHERE source_id = ANY($1) OR target_id = ANY($1)
  ORDER BY weight DESC
`

/**
 * Retrieves a snapshot of significant edges.
 * Role: Captures the active wiring of the brain for visualization or analysis.
 */
export const sql_get_snapshot_edges = (weight_threshold: number) => `
  SELECT ${edge_recall_fields}
  FROM ${app.db.schema_brain}.edges
  WHERE weight > ${weight_threshold}
  ORDER BY weight DESC
  LIMIT ${system.snapshot.snapshot_edges_limit}
`
