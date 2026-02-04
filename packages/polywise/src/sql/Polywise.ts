import {
	EDGE_DECAY_FACTOR,
	EDGE_DISTANCE_MIN,
	EDGE_LEARNING_FACTOR,
	EDGE_WEIGHT_MAX,
	EDGE_WEIGHT_MIN,
	NODE_POTENTIAL_MIN,
	SCHEMA_BRAIN,
	SCHEMA_KNOWLEDGE,
	SNAPSHOT_EDGES_LIMIT,
	TICK_DECAY_RATE,
	TICK_POTENTIAL_MAX
} from '../consts'

export const sql_tick = (threshold: number) => `
  WITH incoming_signals AS (
    SELECT 
      e.target_id, 
      SUM(
        n.activation * e.weight * (1.0 / (1.0 + ln(1.0 + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.updated_at)) / 86400.0))) / (e.distance + 0.1)
      ) as total_input
    FROM \${SCHEMA_BRAIN}.edges e
    JOIN \${SCHEMA_BRAIN}.nodes n ON e.source_id = n.id
    WHERE n.activation > 0
    GROUP BY e.target_id
  )
  UPDATE \${SCHEMA_BRAIN}.nodes
  SET potential = LEAST(potential + COALESCE((SELECT total_input FROM incoming_signals WHERE incoming_signals.target_id = \${SCHEMA_BRAIN}.nodes.id), 0), \${TICK_POTENTIAL_MAX});

  UPDATE \${SCHEMA_BRAIN}.nodes
  SET 
    activation = CASE WHEN potential > \${threshold} THEN 1.0 ELSE 0.0 END,
    potential = CASE WHEN potential > \${threshold} THEN 0.0 ELSE potential * \${TICK_DECAY_RATE} END,
    last_fired_at = CASE WHEN potential > \${threshold} THEN CURRENT_TIMESTAMP ELSE last_fired_at END,
    updated_at = CASE WHEN potential > \${threshold} THEN CURRENT_TIMESTAMP ELSE updated_at END;

  UPDATE \${SCHEMA_BRAIN}.edges e
  SET 
    weight = CASE 
      WHEN (SELECT activation FROM \${SCHEMA_BRAIN}.nodes WHERE id = e.source_id) > 0 
           AND (SELECT activation FROM \${SCHEMA_BRAIN}.nodes WHERE id = e.target_id) > 0 
      THEN LEAST(weight + (\${EDGE_LEARNING_FACTOR} * e.learning_rate), \${EDGE_WEIGHT_MAX})
      ELSE GREATEST(weight - (\${EDGE_DECAY_FACTOR} / e.decay_resistance), \${EDGE_WEIGHT_MIN})
    END,
    updated_at = CASE 
      WHEN (SELECT activation FROM \${SCHEMA_BRAIN}.nodes WHERE id = e.source_id) > 0 
           AND (SELECT activation FROM \${SCHEMA_BRAIN}.nodes WHERE id = e.target_id) > 0 
      THEN CURRENT_TIMESTAMP 
      ELSE updated_at 
    END;

  UPDATE \${SCHEMA_BRAIN}.edges
  SET distance = GREATEST(1.0 / (weight + 0.1), \${EDGE_DISTANCE_MIN});
`

export const sql_add_node = `
  INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y, threshold, idol_id, root_ids, metrics_ids, metadata, embedding, is_action)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING id
`

export const sql_connect = `
  INSERT INTO ${SCHEMA_BRAIN}.edges (source_id, target_id, weight, idol_id, root_ids, metrics_ids, metadata, is_habit)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`

export const sql_stimulate = `UPDATE ${SCHEMA_BRAIN}.nodes SET potential = potential + $1 WHERE id = $2`

export const sql_get_snapshot_nodes = (weight_threshold: number) => `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, is_action, created_at, updated_at
  FROM \${SCHEMA_BRAIN}.nodes
  WHERE potential > \${NODE_POTENTIAL_MIN}
  OR id IN (SELECT source_id FROM \${SCHEMA_BRAIN}.edges WHERE weight > \${weight_threshold})
  OR id IN (SELECT target_id FROM \${SCHEMA_BRAIN}.edges WHERE weight > \${weight_threshold})
`

export const sql_get_snapshot_edges = (weight_threshold: number) => `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata, is_habit, created_at, updated_at
  FROM \${SCHEMA_BRAIN}.edges
  WHERE weight > \${weight_threshold}
  ORDER BY weight DESC
  LIMIT \${SNAPSHOT_EDGES_LIMIT}
`

export const sql_process_article = `
  INSERT INTO ${SCHEMA_KNOWLEDGE}.articles (content, idol_id, root_ids, metrics_ids) 
  VALUES ($1, $2, $3, $4) 
  RETURNING id, content, created_at
`

export const sql_upsert_node = `
  INSERT INTO \${SCHEMA_BRAIN}.nodes (label, x, y, potential, idol_id, root_ids, metrics_ids, metadata, embedding, is_action)
  VALUES ($1, random() * 800, random() * 600, 1.0, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (label) DO UPDATE SET 
    potential = LEAST(\${SCHEMA_BRAIN}.nodes.potential + \${DEFAULT_HEBBIAN_REWARD}, \${TICK_POTENTIAL_MAX}), 
    metadata = \${SCHEMA_BRAIN}.nodes.metadata || EXCLUDED.metadata, 
    embedding = COALESCE(EXCLUDED.embedding, ${SCHEMA_BRAIN}.nodes.embedding), 
    is_action = EXCLUDED.is_action,
    idol_id = COALESCE(EXCLUDED.idol_id, ${SCHEMA_BRAIN}.nodes.idol_id),
    root_ids = CASE WHEN EXCLUDED.root_ids IS NOT NULL THEN (SELECT ARRAY(SELECT DISTINCT unnest(${SCHEMA_BRAIN}.nodes.root_ids || EXCLUDED.root_ids))) ELSE ${SCHEMA_BRAIN}.nodes.root_ids END,
    metrics_ids = CASE WHEN EXCLUDED.metrics_ids IS NOT NULL THEN (SELECT ARRAY(SELECT DISTINCT unnest(${SCHEMA_BRAIN}.nodes.metrics_ids || EXCLUDED.metrics_ids))) ELSE ${SCHEMA_BRAIN}.nodes.metrics_ids END,
    updated_at = CURRENT_TIMESTAMP;
`

export const sql_search_articles_by_text = `
  SELECT id, content, created_at,
    ts_rank(to_tsvector('english', coalesce(content,'')), websearch_to_tsquery('english', $1)) AS rank
  FROM ${SCHEMA_KNOWLEDGE}.articles
  WHERE to_tsvector('english', coalesce(content,'')) @@ websearch_to_tsquery('english', $1)
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
    metadata = metadata || '${JSON.stringify(metadata ?? {})}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
  WHERE source_id = ${sub_id} AND target_id = ${obj_id};
`

export const sql_inject_triples_commit = `COMMIT`

export const sql_upsert_node_select = `SELECT id FROM ${SCHEMA_BRAIN}.nodes WHERE label = $1`

export const sql_node_sources = `INSERT INTO ${SCHEMA_BRAIN}.node_sources (node_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`

export const sql_get_nodes_by_idol = `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, is_action, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE idol_id = $1
`

export const sql_get_nodes_by_root = `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, is_action, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE $1 = ANY(root_ids)
`

export const sql_get_edges_by_idol = `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata, is_habit, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.edges
  WHERE idol_id = $1
`

export const sql_get_edges_by_root = `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata, is_habit, created_at, updated_at
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
    a.content,
    a.created_at,
    1 - (e.embedding <=> $1) AS similarity
  FROM ${SCHEMA_KNOWLEDGE}.articles a
  JOIN ${SCHEMA_KNOWLEDGE}.article_embeddings e ON a.id = e.article_id
  ORDER BY e.embedding <=> $1
  LIMIT $2
`

export const sql_get_article = `SELECT id, content, created_at FROM ${SCHEMA_KNOWLEDGE}.articles WHERE id = $1`

export const sql_get_all_articles = `SELECT id, content, created_at FROM ${SCHEMA_KNOWLEDGE}.articles ORDER BY created_at DESC`

export const sql_update_article = `UPDATE ${SCHEMA_KNOWLEDGE}.articles SET content = $2 WHERE id = $1 RETURNING id, content, created_at`

export const sql_find_nearest_node = `
  SELECT id, label, activation, potential, threshold, metadata, is_action, 1 - (embedding <=> $1) AS similarity
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1
  LIMIT 1
`

export const sql_find_strongest_habit = `
  SELECT 
    e.target_id, 
    n.label as action, 
    n.metadata as action_metadata, 
    e.weight, 
    e.is_habit
  FROM ${SCHEMA_BRAIN}.edges e
  JOIN ${SCHEMA_BRAIN}.nodes n ON e.target_id = n.id
  WHERE e.source_id = $1 AND e.is_habit = true
  ORDER BY e.weight DESC
  LIMIT 1
`

export const sql_update_node_embedding = `UPDATE ${SCHEMA_BRAIN}.nodes SET embedding = $1 WHERE id = $2`

export const sql_set_node_as_action = `UPDATE ${SCHEMA_BRAIN}.nodes SET is_action = $1 WHERE id = $2`

export const sql_set_edge_as_habit = `UPDATE ${SCHEMA_BRAIN}.edges SET is_habit = $1 WHERE source_id = $2 AND target_id = $3`

export const sql_increment_reaction_count = `UPDATE ${SCHEMA_BRAIN}.edges SET reaction_count = reaction_count + 1 WHERE source_id = $1 AND target_id = $2`

export const sql_get_all_nodes = `SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, is_action, created_at, updated_at FROM ${SCHEMA_BRAIN}.nodes`

export const sql_check_articles_table_exists = `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '${SCHEMA_KNOWLEDGE}' AND table_name = 'articles'`

export const sql_update_article_embedding = `UPDATE ${SCHEMA_KNOWLEDGE}.article_embeddings SET embedding = $1 WHERE article_id = $2`
