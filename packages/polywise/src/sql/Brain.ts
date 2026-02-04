import { SCHEMA_BRAIN, SCHEMA_KNOWLEDGE } from '../consts'

export const sql_run_shadow_tick = `
  UPDATE ${SCHEMA_BRAIN}.nodes 
  SET potential = potential + 0.1 
  WHERE id IN (SELECT id FROM ${SCHEMA_BRAIN}.nodes ORDER BY random() LIMIT (SELECT count(*)/100 + 1 FROM ${SCHEMA_BRAIN}.nodes));
`

export const sql_sleep_tick_begin = `BEGIN`

export const sql_sleep_tick_clean_noise = `
  DELETE FROM ${SCHEMA_BRAIN}.edges 
  WHERE weight < 0.001; 
`

export const sql_sleep_tick_decay = `
  UPDATE ${SCHEMA_BRAIN}.edges
  SET weight = GREATEST(weight - 0.01, 0.001)
  WHERE weight < 0.2;
`

export const sql_sleep_tick_replay = `
  UPDATE ${SCHEMA_BRAIN}.edges 
  SET weight = LEAST(weight + 0.2, 5.0)
  WHERE id IN (
    SELECT id FROM ${SCHEMA_BRAIN}.edges 
    WHERE learning_rate > 1.5 
    ORDER BY random() LIMIT 5
  );
`

export const sql_sleep_tick_reset_nodes = `UPDATE ${SCHEMA_BRAIN}.nodes SET potential = 0, activation = 0;`

export const sql_sleep_tick_commit = `COMMIT`

export const sql_recall_nodes_by_label = `
	SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
	FROM ${SCHEMA_BRAIN}.nodes
	WHERE (label ILIKE $1 OR $1 ILIKE '%' || label || '%')
	  AND ($3::text IS NULL OR idol_id = $3)
	  AND ($4::text[] IS NULL OR root_ids && $4)
	ORDER BY potential DESC, activation DESC
	LIMIT $2
`

export const sql_recall_related_nodes = `
	WITH RECURSIVE search_graph AS (
		SELECT source_id, target_id, weight, 1 as depth
		FROM ${SCHEMA_BRAIN}.edges
		WHERE source_id = ANY($1) OR target_id = ANY($1)
		
		UNION ALL
		
		SELECT e.source_id, e.target_id, e.weight, sg.depth + 1
		FROM ${SCHEMA_BRAIN}.edges e
		JOIN search_graph sg ON (e.source_id = sg.target_id OR e.target_id = sg.source_id)
		WHERE sg.depth < $2
		AND e.weight > 0.2
	)
	SELECT DISTINCT n.id, n.label, n.x, n.y, n.activation, n.potential, n.idol_id, n.root_ids, n.metrics_ids, n.metadata, n.created_at, n.updated_at
	FROM ${SCHEMA_BRAIN}.nodes n
	JOIN (
		SELECT DISTINCT source_id as nid FROM search_graph
		UNION
		SELECT DISTINCT target_id as nid FROM search_graph
	) connected ON n.id = connected.nid
	ORDER BY n.potential DESC
	LIMIT $3
`

export const sql_stimulate_nodes_batch = `
	UPDATE ${SCHEMA_BRAIN}.nodes
	SET potential = LEAST(potential + $1, 2.0),
	    updated_at = CURRENT_TIMESTAMP
	WHERE id = ANY($2)
`

export const sql_get_node_articles = `
	SELECT DISTINCT a.id, a.content
	FROM ${SCHEMA_KNOWLEDGE}.articles a
	JOIN ${SCHEMA_BRAIN}.node_sources ns ON a.id = ns.article_id
	WHERE ns.node_id = ANY($1)
`

export const sql_strengthen_edge = `
	UPDATE ${SCHEMA_BRAIN}.edges
	SET weight = LEAST(weight + $1, 5.0),
	    updated_at = CURRENT_TIMESTAMP
	WHERE source_id = $2 AND target_id = $3
`

export const sql_strengthen_edges_batch = `
	UPDATE ${SCHEMA_BRAIN}.edges
	SET weight = LEAST(weight + $1, 5.0),
	    updated_at = CURRENT_TIMESTAMP
	WHERE (source_id = ANY($2) AND target_id = ANY($3))
	   OR (source_id = ANY($3) AND target_id = ANY($2))
`

export const sql_get_high_potential_nodes = `
	SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
	FROM ${SCHEMA_BRAIN}.nodes
	WHERE potential > $1
	ORDER BY potential DESC
	LIMIT $2
`

export const sql_get_node_by_id = `
	SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
	FROM ${SCHEMA_BRAIN}.nodes
	WHERE id = $1
`

export const sql_get_node_by_label = `SELECT id FROM ${SCHEMA_BRAIN}.nodes WHERE label = $1`

export const sql_get_strong_habits = `
  SELECT n.label, e.weight 
  FROM ${SCHEMA_BRAIN}.edges e 
  JOIN ${SCHEMA_BRAIN}.nodes n ON e.target_id = n.id 
  WHERE e.is_habit = true AND e.weight > $1
  ORDER BY e.weight DESC LIMIT $2
`
