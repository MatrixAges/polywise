import { app, system } from '../consts'
import { sql_begin, sql_commit } from './meta'

/**
 * Randomly increases the potential of a small subset (1%) of nodes.
 * Role: Simulates background neural noise or "shadow" activity to prevent system stagnation and enable spontaneous activation.
 */
export const sql_run_shadow_tick = `
  UPDATE ${app.schema_brain}.nodes
  SET potential = potential + ${system.strengthen_edge_weight}
  WHERE id IN (
    SELECT id
    FROM ${app.schema_brain}.nodes
    ORDER BY random()
    LIMIT (SELECT count(*) / 100 + 1 FROM ${app.schema_brain}.nodes)
  )
`

/**
 * Removes edges with negligible weight.
 * Role: Neural pruning mechanism to remove unused or insignificant connections, optimizing graph size and traversal performance.
 */
export const sql_sleep_tick_clean_noise = `
  DELETE FROM ${app.schema_brain}.edges
  WHERE weight < ${system.weight_death_threshold}
`

/**
 * Decays weak or competitively dominated edges after inactivity.
 * Role: Implements selective synaptic decay and local competition, down-weighting edges that lose to stronger neighbors.
 */
export const sql_sleep_tick_decay_edges = `
  WITH max_outgoing AS (
    SELECT source_id, MAX(weight) AS max_weight
    FROM ${app.schema_brain}.edges
    GROUP BY source_id
  )
  UPDATE ${app.schema_brain}.edges e
  SET
    weight = e.weight * (1.0 - ${system.edge_decay_rate}),
    distance = 1.0 / (e.weight * (1.0 - ${system.edge_decay_rate}) + ${system.distance_epsilon}),
    updated_at = CURRENT_TIMESTAMP
  FROM max_outgoing m
  WHERE e.source_id = m.source_id
    AND e.lock IS NOT TRUE
    AND (
      (e.weight < ${system.potential_threshold} AND e.updated_at < CURRENT_TIMESTAMP - INTERVAL '${system.edge_inactive_days} days')
      OR (
        e.weight < m.max_weight * ${system.competitive_decay_ratio}
        AND e.updated_at < CURRENT_TIMESTAMP - INTERVAL '${system.competitive_inactive_days} days'
      )
    )
`

/**
 * Strengthens a prioritized subset of high-learning-rate, recent edges.
 * Role: Simulates experience-biased "memory replay" during sleep with context sequence weighting.
 */
export const sql_sleep_tick_replay = `
  WITH context_scores AS (
    SELECT unnest($1::text[]) AS context_id, unnest($2::real[]) AS score
  )
  UPDATE ${app.schema_brain}.edges e
  SET weight = LEAST(e.weight + ${system.edge_learning_factor}, ${system.edge_weight_max})
  WHERE e.id IN (
    SELECT e2.id
    FROM ${app.schema_brain}.edges e2
    LEFT JOIN context_scores cs ON e2.context_id = cs.context_id
    WHERE e2.learning_rate > ${system.replay_learning_rate_min}
      AND e2.updated_at > CURRENT_TIMESTAMP - INTERVAL '${system.replay_recency_days} days'
    ORDER BY COALESCE(cs.score, ${system.min_potential}) DESC, e2.updated_at DESC, e2.learning_rate DESC, e2.weight DESC
    LIMIT ${system.replay_priority_limit}
  )
`

/**
 * Decays the potential of inactive nodes.
 * Role: Implements selective node decay - only decays nodes that are low-potential and long-inactive.
 */
export const sql_sleep_tick_decay_nodes = `
  UPDATE ${app.schema_brain}.nodes
  SET potential = potential * ${system.node_decay_rate},
      updated_at = CURRENT_TIMESTAMP
  WHERE lock IS NOT TRUE
    AND potential < ${system.potential_threshold}
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '${system.node_inactive_days} days'
`

/**
 * Decays the weight of edges over time (LTD - Long-Term Depression).
 * Role: Implements the forgetting curve for memories, allowing unused connections to fade.
 */
export const sql_decay_edges_ltd = `
  UPDATE ${app.schema_brain}.edges
  SET weight = GREATEST(weight - (${system.edge_decay_factor} / decay_resistance), ${system.weak_edge_threshold}),
      distance = GREATEST(
        1.0 / (GREATEST(weight - (${system.edge_decay_factor} / decay_resistance), ${system.weak_edge_threshold}) + ${system.distance_epsilon}),
        ${system.edge_weight_min}
      )
  WHERE lock IS NOT TRUE
`

/**
 * Memory reorganization step 1.
 * Role: Weakens low-weight edges during idle consolidation.
 */
export const sql_reorg_decay_weak_edges = `
  UPDATE ${app.schema_brain}.edges
  SET weight = GREATEST(weight * ${system.decay_strength}, ${system.weak_edge_threshold}),
      distance = GREATEST(1.0 / (weight * ${system.decay_strength} + ${system.distance_epsilon}), ${system.edge_weight_min})
  WHERE lock IS NOT TRUE
    AND weight < ${system.potential_threshold}
`

/**
 * Memory reorganization step 2.
 * Role: Reinforces high-value edges during idle consolidation.
 */
export const sql_reorg_strengthen_strong_edges = `
  UPDATE ${app.schema_brain}.edges
  SET weight = LEAST(weight + ${system.reorganization_strength}, ${system.edge_weight_max}),
      distance = GREATEST(1.0 / (weight + ${system.reorganization_strength} + ${system.distance_epsilon}), ${system.edge_weight_min})
  WHERE lock IS NOT TRUE
    AND weight > ${system.potential_threshold}
`

/**
 * Memory reorganization step 3.
 * Role: Prunes too-weak edges after consolidation updates.
 */
export const sql_reorg_delete_too_weak_edges = `
  DELETE FROM ${app.schema_brain}.edges
  WHERE weight < ${system.weak_edge_threshold}
    AND lock IS NOT TRUE
`

/**
 * Counts the number of currently active nodes.
 * Role: Used to calculate system heat (load) for homeostatic plasticity and overload detection.
 */
export const sql_get_active_node_count = `
  SELECT COUNT(*) as count
  FROM ${app.schema_brain}.nodes
  WHERE is_active = TRUE
`

/**
 * Memory reorganization triggered by idle state.
 * Role: Simulates brain's memory consolidation during rest - weakens unused connections, reinforces important ones.
 * Unlike time-based decay, this is triggered by new learning events going idle.
 * Synchronously updates distance to reflect synaptic efficiency changes.
 */
export const sql_memory_reorganization = `
	${sql_begin};

	UPDATE ${app.schema_brain}.edges
	SET weight = GREATEST(weight * ${system.decay_strength}, ${system.weak_edge_threshold}),
	    distance = GREATEST(1.0 / (weight * ${system.decay_strength} + ${system.distance_epsilon}), 0.1)
	WHERE (lock IS NULL OR lock = FALSE)
	  AND weight < 0.5;

	UPDATE ${app.schema_brain}.edges
	SET weight = LEAST(weight + ${system.reorganization_strength}, ${system.edge_weight_max}),
	    distance = GREATEST(1.0 / (weight + ${system.reorganization_strength} + ${system.distance_epsilon}), 0.1)
	WHERE (lock IS NULL OR lock = FALSE)
	  AND weight > 0.5;

	DELETE FROM ${app.schema_brain}.edges
	WHERE weight < ${system.weak_edge_threshold}
	  AND (lock IS NULL OR lock = FALSE);

	${sql_commit};
`

/**
 * Strengthens edges for a set of context ids.
 * Role: Reinforces replayed context trajectories during consolidation.
 */
export const sql_strengthen_edges_by_context = `
	UPDATE ${app.schema_brain}.edges
	SET weight = LEAST(weight + $1, ${system.edge_weight_max}),
	    distance = GREATEST(1.0 / (LEAST(weight + $1, ${system.edge_weight_max}) + ${system.distance_epsilon}), 0.1),
	    updated_at = CURRENT_TIMESTAMP
	WHERE context_id = ANY($2)
	  AND (lock IS NULL OR lock = FALSE)
`

/**
 * Strengthens edges for context ids with per-context strengths.
 * Role: Reinforces replayed context trajectories during consolidation with weighted replay intensity.
 * Mapping: context_ids[i] -> strengths[i].
 */
export const sql_strengthen_edges_by_context_batch = `
	WITH replay_input AS (SELECT context_id, strength FROM unnest($1::text[], $2::float8[]) AS input(context_id, strength)),
	target_rows AS (
		SELECT e.id, LEAST(e.weight + r.strength, ${system.edge_weight_max}) AS next_weight
		FROM ${app.schema_brain}.edges e
		INNER JOIN replay_input r ON e.context_id = r.context_id
		WHERE (e.lock IS NULL OR e.lock = FALSE)
	)
	UPDATE ${app.schema_brain}.edges e
	SET weight = t.next_weight,
	    distance = GREATEST(1.0 / (t.next_weight + ${system.distance_epsilon}), 0.1),
	    updated_at = CURRENT_TIMESTAMP
	FROM target_rows t
	WHERE e.id = t.id
`

/**
 * Retrieves nodes matching a text label pattern.
 * Role: Keyword-based memory retrieval entry point, allowing the system to recall concepts by name.
 */
export const sql_recall_nodes_by_label = `
	SELECT id, label, x, y, potential, created_at, updated_at
	FROM ${app.schema_brain}.nodes
	WHERE (label ILIKE $1 OR $1 ILIKE '%' || label || '%')
	ORDER BY potential DESC
	LIMIT $2
`

/**
 * Performs a recursive graph search to find nodes related to the starting set.
 * Role: Associative memory recall (spreading activation). Finds concepts that are strongly connected to the initial thoughts, up to a certain depth.
 */
export const sql_recall_related_nodes = `
	WITH RECURSIVE search_graph AS (
		SELECT source_id, target_id, weight, 1 as depth
		FROM ${app.schema_brain}.edges
		WHERE (source_id = ANY($1) OR target_id = ANY($1))
		  AND ($4::text IS NULL OR context_id = $4)
		
		UNION ALL
		
		SELECT e.source_id, e.target_id, e.weight, sg.depth + 1
		FROM ${app.schema_brain}.edges e
		JOIN search_graph sg ON (e.source_id = sg.target_id OR e.target_id = sg.source_id)
		WHERE sg.depth < $2
		AND e.weight > 0.2
		AND ($4::text IS NULL OR e.context_id = $4)
	)
	SELECT DISTINCT n.id, n.label, n.x, n.y, n.potential, n.created_at, n.updated_at
	FROM ${app.schema_brain}.nodes n
	JOIN (
		SELECT DISTINCT source_id as nid FROM search_graph
		UNION
		SELECT DISTINCT target_id as nid FROM search_graph
	) connected ON n.id = connected.nid
	WHERE ($4::text IS NULL OR n.context_id = $4)
	ORDER BY n.potential DESC
	LIMIT $3
`

/**
 * Retrieves all edges connecting a set of nodes.
 * Role: Reconstructs the local graph structure for a set of recalled concepts.
 */
export const sql_get_edges_between_nodes = `
	SELECT id, source_id, target_id, weight, distance, learning_rate, decay_resistance, context_id, created_at, updated_at
	FROM ${app.schema_brain}.edges
	WHERE source_id = ANY($1) AND target_id = ANY($1)
`

/**
 * Retrieves original content articles associated with specific nodes.
 * Role: Grounds abstract node concepts back to their source knowledge/text for detailed retrieval.
 */
export const sql_get_node_articles = `
	SELECT DISTINCT a.id, a.content
	FROM ${app.schema_brain}.articles a
	JOIN ${app.schema_brain}.node_sources ns ON a.id = ns.article_id
	WHERE ns.node_id = ANY($1)
`
