export const sql_tick = (threshold: number) => `
  WITH incoming_signals AS (
    SELECT 
      e.target_id, 
      SUM(n.activation * e.weight / (e.distance + 0.1)) as total_input
    FROM brain.edges e
    JOIN brain.nodes n ON e.source_id = n.id
    WHERE n.activation > 0
    GROUP BY e.target_id
  )
  UPDATE brain.nodes
  SET potential = LEAST(potential + COALESCE((SELECT total_input FROM incoming_signals WHERE incoming_signals.target_id = brain.nodes.id), 0), 2.0);

  UPDATE brain.nodes
  SET 
    activation = CASE WHEN potential > ${threshold} THEN 1.0 ELSE 0.0 END,
    potential = CASE WHEN potential > ${threshold} THEN 0.0 ELSE potential * 0.9 END,
    last_fired_at = CASE WHEN potential > ${threshold} THEN CURRENT_TIMESTAMP ELSE last_fired_at END;

  UPDATE brain.edges e
  SET weight = CASE 
    WHEN (SELECT activation FROM brain.nodes WHERE id = e.source_id) > 0 
         AND (SELECT activation FROM brain.nodes WHERE id = e.target_id) > 0 
    THEN LEAST(weight + (0.2 * e.learning_rate), 5.0)
    ELSE GREATEST(weight - (0.001 / e.decay_resistance), 0.1)
  END;

  UPDATE brain.edges
  SET distance = GREATEST(1.0 / (weight + 0.1), 0.2);
`

export const sql_add_node = `INSERT INTO brain.nodes (label, x, y, threshold) VALUES ($1, $2, $3, $4) RETURNING id`

export const sql_connect = `INSERT INTO brain.edges (source_id, target_id, weight) VALUES ($1, $2, $3)`

export const sql_stimulate = `UPDATE brain.nodes SET potential = potential + $1 WHERE id = $2`

export const sql_get_snapshot_nodes = (weight_threshold: number) => `
  SELECT id, label, x, y, activation, potential 
  FROM brain.nodes 
  WHERE potential > 0.05 
  OR id IN (SELECT source_id FROM brain.edges WHERE weight > ${weight_threshold}) 
  OR id IN (SELECT target_id FROM brain.edges WHERE weight > ${weight_threshold})
`

export const sql_get_snapshot_edges = (weight_threshold: number) => `
  SELECT source_id, target_id, weight, distance, type 
  FROM brain.edges 
  WHERE weight > ${weight_threshold} 
  ORDER BY weight DESC 
  LIMIT 500
`

export const sql_process_article = `INSERT INTO knowledge.articles (title, content) VALUES ($1, $2) RETURNING id`

export const sql_inject_triples_begin = `BEGIN`

export const sql_inject_triples_insert_edge = (
	sub_id: number,
	obj_id: number,
	learning_rate: number,
	decay_resistance: number,
	predicate: string,
	weight: number
) => `
  INSERT INTO brain.edges (source_id, target_id, weight, type, learning_rate, decay_resistance)
  VALUES (${sub_id}, ${obj_id}, ${weight}, '${predicate}', ${learning_rate}, ${decay_resistance})
  ON CONFLICT DO NOTHING;
`

export const sql_inject_triples_update_edge = (
	sub_id: number,
	obj_id: number,
	learning_rate: number,
	decay_resistance: number,
	weight: number
) => `
  UPDATE brain.edges 
  SET 
    learning_rate = GREATEST(learning_rate, ${learning_rate}),
    decay_resistance = GREATEST(decay_resistance, ${decay_resistance}),
    weight = LEAST(weight + ${weight}, 5.0) 
  WHERE source_id = ${sub_id} AND target_id = ${obj_id};
`

export const sql_inject_triples_commit = `COMMIT`

export const sql_upsert_node = `
  INSERT INTO brain.nodes (label, x, y, potential)
  VALUES ($1, random() * 800, random() * 600, 1.0)
  ON CONFLICT (label) DO UPDATE SET potential = brain.nodes.potential + 0.5;
`

export const sql_upsert_node_select = `SELECT id FROM brain.nodes WHERE label = $1`

export const sql_node_sources = `INSERT INTO brain.node_sources (node_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`
