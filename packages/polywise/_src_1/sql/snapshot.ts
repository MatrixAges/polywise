import { app, system } from '../consts'
import { node_select_fields } from './fragments'

/**
 * Retrieves a snapshot of active or significant nodes.
 * Role: Captures the current "state of mind" for visualization or analysis, filtering out dormant nodes.
 */
export const sql_get_snapshot_nodes = (weight_threshold: number, limit: number) => `
  SELECT ${node_select_fields}
  FROM ${app.schema_brain}.nodes
  WHERE potential > ${system.node_potential_min}
  OR id IN (SELECT source_id FROM ${app.schema_brain}.edges WHERE weight > ${weight_threshold})
  OR id IN (SELECT target_id FROM ${app.schema_brain}.edges WHERE weight > ${weight_threshold})
  ORDER BY potential DESC
  LIMIT ${limit}
`

/**
 * Retrieves top N nodes by potential for snapshot seeding.
 * Role: Gets the highest potential nodes to use as seeds for BFS expansion.
 */
export const sql_get_top_nodes_by_potential = (limit: number) => `
  SELECT ${node_select_fields}
  FROM ${app.schema_brain}.nodes
  ORDER BY potential DESC
  LIMIT ${limit}
`
