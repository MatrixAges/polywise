import { app } from '../consts'

export const node_select_fields = `
  id, label, x, y, potential, threshold, current_threshold, transmitter, is_active,
  article_ids, lock, created_at, updated_at
`

export const node_recall_fields = `
  id, label, x, y, potential, created_at, updated_at
`

export const edge_select_fields = `
  id, source_id, target_id, weight, distance, learning_rate, decay_resistance,
  lock, created_at, updated_at
`

export const edge_recall_fields = `
  id, source_id, target_id, weight, distance, learning_rate, decay_resistance,
  created_at, updated_at
`

export const article_select_fields = `
  id, content, created_at, updated_at, metadata
`

export const sql_node_sources_join_articles = `
  SELECT DISTINCT a.id, a.content
  FROM ${app.schema_memory}.articles a
  JOIN ${app.schema_brain}.node_sources ns ON a.id = ns.article_id
  WHERE ns.node_id = ANY($1)
`
