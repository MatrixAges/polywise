import { app } from '../consts'

export const node_select_fields = `
  id, label, x, y, potential, threshold, current_threshold, transmitter, is_active,
  idol_id, root_ids, context_id, article_ids, lock, created_at, updated_at
`

export const node_recall_fields = `
  id, label, x, y, potential, idol_id, root_ids, context_id, created_at, updated_at
`

export const edge_select_fields = `
  id, source_id, target_id, weight, distance, learning_rate, decay_resistance,
  idol_id, root_ids, context_id, lock, created_at, updated_at
`

export const edge_recall_fields = `
  id, source_id, target_id, weight, distance, learning_rate, decay_resistance,
  idol_id, root_ids, context_id, created_at, updated_at
`

export const article_select_fields = `
  id, content, created_at, updated_at, metadata, context_id
`

export const sql_node_sources_join_articles = `
  SELECT DISTINCT a.id, a.content
  FROM ${app.db.schema_memory}.articles a
  JOIN ${app.db.schema_brain}.node_sources ns ON a.id = ns.article_id
  WHERE ns.node_id = ANY($1)
`
