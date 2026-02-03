import { SCHEMA_BRAIN, SCHEMA_KNOWLEDGE } from '../consts'

export const sql_tick = (threshold: number) => `
  WITH incoming_signals AS (
    SELECT 
      e.target_id, 
      SUM(n.activation * e.weight / (e.distance + 0.1)) as total_input
    FROM ${SCHEMA_BRAIN}.edges e
    JOIN ${SCHEMA_BRAIN}.nodes n ON e.source_id = n.id
    WHERE n.activation > 0
    GROUP BY e.target_id
  )
  UPDATE ${SCHEMA_BRAIN}.nodes
  SET potential = LEAST(potential + COALESCE((SELECT total_input FROM incoming_signals WHERE incoming_signals.target_id = ${SCHEMA_BRAIN}.nodes.id), 0), 2.0);

  UPDATE ${SCHEMA_BRAIN}.nodes
  SET 
    activation = CASE WHEN potential > ${threshold} THEN 1.0 ELSE 0.0 END,
    potential = CASE WHEN potential > ${threshold} THEN 0.0 ELSE potential * 0.9 END,
    last_fired_at = CASE WHEN potential > ${threshold} THEN CURRENT_TIMESTAMP ELSE last_fired_at END;

  UPDATE ${SCHEMA_BRAIN}.edges e
  SET weight = CASE 
    WHEN (SELECT activation FROM ${SCHEMA_BRAIN}.nodes WHERE id = e.source_id) > 0 
         AND (SELECT activation FROM ${SCHEMA_BRAIN}.nodes WHERE id = e.target_id) > 0 
    THEN LEAST(weight + (0.2 * e.learning_rate), 5.0)
    ELSE GREATEST(weight - (0.001 / e.decay_resistance), 0.1)
  END;

  UPDATE ${SCHEMA_BRAIN}.edges
  SET distance = GREATEST(1.0 / (weight + 0.1), 0.2);
`

export const sql_add_node = `
  INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y, threshold, idol_id, root_ids, metrics_ids, metadata)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING id
`

export const sql_connect = `
  INSERT INTO ${SCHEMA_BRAIN}.edges (source_id, target_id, weight, idol_id, root_ids, metrics_ids, metadata)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
`

export const sql_stimulate = `UPDATE ${SCHEMA_BRAIN}.nodes SET potential = potential + $1 WHERE id = $2`

export const sql_get_snapshot_nodes = (weight_threshold: number) => `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE potential > 0.05
  OR id IN (SELECT source_id FROM ${SCHEMA_BRAIN}.edges WHERE weight > ${weight_threshold})
  OR id IN (SELECT target_id FROM ${SCHEMA_BRAIN}.edges WHERE weight > ${weight_threshold})
`

export const sql_get_snapshot_edges = (weight_threshold: number) => `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata
  FROM ${SCHEMA_BRAIN}.edges
  WHERE weight > ${weight_threshold}
  ORDER BY weight DESC
  LIMIT 500
`

export const sql_process_article = `INSERT INTO ${SCHEMA_KNOWLEDGE}.articles (title, content) VALUES ($1, $2) RETURNING *`

export const sql_search_articles_by_text = `
  SELECT id, title, content, created_at,
    ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')), plainto_tsquery('english', $1)) AS rank
  FROM ${SCHEMA_KNOWLEDGE}.articles
  WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')) @@ plainto_tsquery('english', $1)
  ORDER BY rank DESC
  LIMIT $2
`

export const sql_inject_triples_begin = `BEGIN`

export const sql_inject_triples_insert_edge = (
	sub_id: number,
	obj_id: number,
	learning_rate: number,
	decay_resistance: number,
	predicate: string,
	weight: number,
	idol_id?: string,
	root_ids?: string[],
	metrics_ids?: string[],
	metadata?: any
) => `
  INSERT INTO ${SCHEMA_BRAIN}.edges (source_id, target_id, learning_rate, decay_resistance, type, weight, idol_id, root_ids, metrics_ids, metadata)
  SELECT ${sub_id}, ${obj_id}, ${learning_rate}, ${decay_resistance}, '${predicate}', ${weight}, ${idol_id ? `'${idol_id}'` : 'NULL'}, ${root_ids && root_ids.length > 0 ? `ARRAY[${root_ids.map(id => `'${id}'`).join(',')}]` : 'NULL'}, ${metrics_ids && metrics_ids.length > 0 ? `ARRAY[${metrics_ids.map(id => `'${id}'`).join(',')}]` : 'NULL'}, '${JSON.stringify(metadata ?? {})}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM ${SCHEMA_BRAIN}.edges WHERE source_id = ${sub_id} AND target_id = ${obj_id});
`

export const sql_inject_triples_update_edge = (
	sub_id: number,
	obj_id: number,
	learning_rate: number,
	decay_resistance: number,
	weight: number,
	idol_id?: string,
	root_ids?: string[],
	metrics_ids?: string[],
	metadata?: any
) => `
  UPDATE ${SCHEMA_BRAIN}.edges
  SET
    learning_rate = GREATEST(learning_rate, ${learning_rate}),
    decay_resistance = GREATEST(decay_resistance, ${decay_resistance}),
    weight = LEAST(weight + ${weight}, 5.0),
    idol_id = COALESCE(${idol_id ? `'${idol_id}'` : 'NULL'}, idol_id),
    root_ids = COALESCE(${root_ids && root_ids.length > 0 ? `ARRAY[${root_ids.map(id => `'${id}'`).join(',')}]` : 'NULL'}, root_ids),
    metrics_ids = COALESCE(${metrics_ids && metrics_ids.length > 0 ? `ARRAY[${metrics_ids.map(id => `'${id}'`).join(',')}]` : 'NULL'}, metrics_ids),
    metadata = metadata || '${JSON.stringify(metadata ?? {})}'::jsonb
  WHERE source_id = ${sub_id} AND target_id = ${obj_id};
`

export const sql_inject_triples_commit = `COMMIT`

export const sql_upsert_node = `
  INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y, potential, idol_id, root_ids, metrics_ids, metadata)
  VALUES ($1, random() * 800, random() * 600, 1.0, $2, $3, $4, $5)
  ON CONFLICT (label) DO UPDATE SET potential = ${SCHEMA_BRAIN}.nodes.potential + 0.5, metadata = ${SCHEMA_BRAIN}.nodes.metadata || EXCLUDED.metadata;
`

export const sql_upsert_node_select = `SELECT id FROM ${SCHEMA_BRAIN}.nodes WHERE label = $1`

export const sql_node_sources = `INSERT INTO ${SCHEMA_BRAIN}.node_sources (node_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`

export const sql_get_nodes_by_idol = `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE idol_id = $1
`

export const sql_get_nodes_by_root = `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE $1 = ANY(root_ids)
`

export const sql_get_edges_by_idol = `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata
  FROM ${SCHEMA_BRAIN}.edges
  WHERE idol_id = $1
`

export const sql_get_edges_by_root = `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata
  FROM ${SCHEMA_BRAIN}.edges
  WHERE $1 = ANY(root_ids)
`

export const sql_insert_article_embedding = `
  INSERT INTO ${SCHEMA_KNOWLEDGE}.article_embeddings (article_id, embedding)
  VALUES ($1, $2)
  RETURNING id
`

export const sql_get_article_embedding = `SELECT embedding FROM ${SCHEMA_KNOWLEDGE}.article_embeddings WHERE article_id = $1`

export const sql_search_articles_by_vector = `
  SELECT 
    a.id,
    a.title,
    a.content,
    a.created_at,
    1 - (e.embedding <=> $1) AS similarity
  FROM ${SCHEMA_KNOWLEDGE}.articles a
  JOIN ${SCHEMA_KNOWLEDGE}.article_embeddings e ON a.id = e.article_id
  ORDER BY e.embedding <=> $1
  LIMIT $2
`

export const sql_get_article = `SELECT id, title, content, created_at FROM ${SCHEMA_KNOWLEDGE}.articles WHERE id = $1`

export const sql_get_all_articles = `SELECT id, title, content, created_at FROM ${SCHEMA_KNOWLEDGE}.articles ORDER BY created_at DESC`

export const sql_update_article = `UPDATE ${SCHEMA_KNOWLEDGE}.articles SET title = $2, content = $3 WHERE id = $1 RETURNING id, title, content, created_at`
