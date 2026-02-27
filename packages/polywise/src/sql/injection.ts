import { app, system } from '../consts'

/**
 * Inserts an edge if not exists.
 * Role: Safe idempotent edge creation during extraction/injection pipeline.
 */
export const sql_inject_edges_insert_edge = (
	sub_id: string,
	obj_id: string,
	learning_rate: number,
	decay_resistance: number,
	weight: number
) => `
  INSERT INTO ${app.schema_brain}.edges (id, source_id, target_id, learning_rate, decay_resistance, weight)
  SELECT '${sub_id}_${obj_id}', '${sub_id}', '${obj_id}', ${learning_rate}, ${decay_resistance}, ${weight}
  WHERE NOT EXISTS (SELECT 1 FROM ${app.schema_brain}.edges WHERE source_id = '${sub_id}' AND target_id = '${obj_id}');
`

/**
 * Updates an existing edge, strengthening weight and core params.
 * Role: Reinforces known relationships while preserving max bounds.
 */
export const sql_inject_edges_update_edge = (
	sub_id: string,
	obj_id: string,
	learning_rate: number,
	decay_resistance: number,
	weight: number
) => `
  UPDATE ${app.schema_brain}.edges
  SET
    learning_rate = GREATEST(learning_rate, ${learning_rate}),
    decay_resistance = GREATEST(decay_resistance, ${decay_resistance}),
    weight = LEAST(weight + ${weight}, ${system.edge_weight_max}),
    updated_at = CURRENT_TIMESTAMP
  WHERE source_id = '${sub_id}' AND target_id = '${obj_id}';
`
