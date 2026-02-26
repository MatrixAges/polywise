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
	weight: number,
	idol_id?: string | null,
	root_ids?: string[] | null,
	context_id?: string | null
) => `
  INSERT INTO ${app.db.schema_brain}.edges (id, source_id, target_id, learning_rate, decay_resistance, weight, idol_id, root_ids, context_id)
  SELECT '${sub_id}_${obj_id}', '${sub_id}', '${obj_id}', ${learning_rate}, ${decay_resistance}, ${weight}, ${idol_id ? `'${idol_id}'` : 'NULL'}, ${root_ids && root_ids.length > 0 ? `ARRAY[${root_ids.map(id => `'${id}'`).join(',')}]` : 'NULL'}, '${context_id ?? 'global'}'
  WHERE NOT EXISTS (SELECT 1 FROM ${app.db.schema_brain}.edges WHERE source_id = '${sub_id}' AND target_id = '${obj_id}');
`

/**
 * Updates an existing edge, merging metadata and strengthening weight.
 * Role: Reinforces known relationships while preserving max bounds and lineage fields.
 */
export const sql_inject_edges_update_edge = (
	sub_id: string,
	obj_id: string,
	learning_rate: number,
	decay_resistance: number,
	weight: number,
	idol_id?: string | null,
	root_ids?: string[] | null,
	context_id?: string | null
) => {
	const has_root_ids = Boolean(root_ids && root_ids.length > 0)
	const root_ids_array = has_root_ids ? `ARRAY[${root_ids!.map(id => `'${id}'`).join(',')}]` : 'NULL'

	return `
  UPDATE ${app.db.schema_brain}.edges
  SET
    learning_rate = GREATEST(learning_rate, ${learning_rate}),
    decay_resistance = GREATEST(decay_resistance, ${decay_resistance}),
    weight = LEAST(weight + ${weight}, ${system.node_edge.edge_weight_max}),
    idol_id = COALESCE(${idol_id ? `'${idol_id}'` : 'NULL'}, idol_id),
    context_id = COALESCE(${context_id ? `'${context_id}'` : 'NULL'}, context_id),
    root_ids = CASE WHEN ${has_root_ids} THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(root_ids, '{}') || ${root_ids_array}))) ELSE root_ids END,
    updated_at = CURRENT_TIMESTAMP
  WHERE source_id = '${sub_id}' AND target_id = '${obj_id}';
`
}
