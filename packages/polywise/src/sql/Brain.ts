import { app, system } from '../consts'

/**
 * Begins a transaction.
 * Role: Ensures a group of SQL operations execute atomically.
 */
export const sql_sleep_tick_begin = `BEGIN`

/**
 * Commits a transaction.
 * Role: Finalizes all SQL changes in current transaction.
 */
export const sql_sleep_tick_commit = `COMMIT`

/**
 * Rolls back a transaction.
 * Role: Reverts all SQL changes in current transaction.
 */
export const sql_sleep_tick_rollback = `ROLLBACK`

/**
 * Randomly increases the potential of a small subset (1%) of nodes.
 * Role: Simulates background neural noise or "shadow" activity to prevent system stagnation and enable spontaneous activation.
 */
export const sql_run_shadow_tick = `
  UPDATE ${app.db.schema_brain}.nodes
  SET potential = potential + ${system.node_edge.strengthen_edge_weight}
  WHERE id IN (
    SELECT id
    FROM ${app.db.schema_brain}.nodes
    ORDER BY random()
    LIMIT (SELECT count(*) / 100 + 1 FROM ${app.db.schema_brain}.nodes)
  )
`

/**
 * Removes edges with negligible weight.
 * Role: Neural pruning mechanism to remove unused or insignificant connections, optimizing graph size and traversal performance.
 */
export const sql_sleep_tick_clean_noise = `
  DELETE FROM ${app.db.schema_brain}.edges
  WHERE weight < ${system.shy.weight_death_threshold}
`

/**
 * Decays weak or competitively dominated edges after inactivity.
 * Role: Implements selective synaptic decay and local competition, down-weighting edges that lose to stronger neighbors.
 */
export const sql_sleep_tick_decay_edges = `
  WITH max_outgoing AS (
    SELECT source_id, MAX(weight) AS max_weight
    FROM ${app.db.schema_brain}.edges
    GROUP BY source_id
  )
  UPDATE ${app.db.schema_brain}.edges e
  SET
    weight = e.weight * (1.0 - ${system.shy.edge_decay_rate}),
    distance = 1.0 / (e.weight * (1.0 - ${system.shy.edge_decay_rate}) + ${system.tick.distance_epsilon}),
    updated_at = CURRENT_TIMESTAMP
  FROM max_outgoing m
  WHERE e.source_id = m.source_id
    AND e.lock IS NOT TRUE
    AND (
      (e.weight < ${system.node_edge.potential_threshold} AND e.updated_at < CURRENT_TIMESTAMP - INTERVAL '${system.shy.edge_inactive_days} days')
      OR (
        e.weight < m.max_weight * ${system.shy.competitive_decay_ratio}
        AND e.updated_at < CURRENT_TIMESTAMP - INTERVAL '${system.shy.competitive_inactive_days} days'
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
  UPDATE ${app.db.schema_brain}.edges e
  SET weight = LEAST(e.weight + ${system.node_edge.edge_learning_factor}, ${system.node_edge.edge_weight_max})
  WHERE e.id IN (
    SELECT e2.id
    FROM ${app.db.schema_brain}.edges e2
    LEFT JOIN context_scores cs ON e2.context_id = cs.context_id
    WHERE e2.learning_rate > ${system.replay.replay_learning_rate_min}
      AND e2.updated_at > CURRENT_TIMESTAMP - INTERVAL '${system.replay.replay_recency_days} days'
    ORDER BY COALESCE(cs.score, ${system.tick.min_potential}) DESC, e2.updated_at DESC, e2.learning_rate DESC, e2.weight DESC
    LIMIT ${system.replay.replay_priority_limit}
  )
`

/**
 * Decays the potential of inactive nodes.
 * Role: Implements selective node decay - only decays nodes that are low-potential and long-inactive.
 */
export const sql_sleep_tick_decay_nodes = `
  UPDATE ${app.db.schema_brain}.nodes
  SET potential = potential * ${system.shy.node_decay_rate},
      updated_at = CURRENT_TIMESTAMP
  WHERE lock IS NOT TRUE
    AND potential < ${system.node_edge.potential_threshold}
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '${system.shy.node_inactive_days} days'
`

/**
 * Decays the weight of edges over time (LTD - Long-Term Depression).
 * Role: Implements the forgetting curve for memories, allowing unused connections to fade.
 */
export const sql_decay_edges_ltd = `
  UPDATE ${app.db.schema_brain}.edges
  SET weight = GREATEST(weight - (${system.node_edge.edge_decay_factor} / decay_resistance), ${system.node_edge.weak_edge_threshold}),
      distance = GREATEST(
        1.0 / (GREATEST(weight - (${system.node_edge.edge_decay_factor} / decay_resistance), ${system.node_edge.weak_edge_threshold}) + ${system.tick.distance_epsilon}),
        ${system.node_edge.edge_weight_min}
      )
  WHERE lock IS NOT TRUE
`

/**
 * Memory reorganization step 1.
 * Role: Weakens low-weight edges during idle consolidation.
 */
export const sql_reorg_decay_weak_edges = `
  UPDATE ${app.db.schema_brain}.edges
  SET weight = GREATEST(weight * ${system.tick.decay_strength}, ${system.node_edge.weak_edge_threshold}),
      distance = GREATEST(1.0 / (weight * ${system.tick.decay_strength} + ${system.tick.distance_epsilon}), ${system.node_edge.edge_weight_min})
  WHERE lock IS NOT TRUE
    AND weight < ${system.node_edge.potential_threshold}
`

/**
 * Memory reorganization step 2.
 * Role: Reinforces high-value edges during idle consolidation.
 */
export const sql_reorg_strengthen_strong_edges = `
  UPDATE ${app.db.schema_brain}.edges
  SET weight = LEAST(weight + ${system.tick.reorganization_strength}, ${system.node_edge.edge_weight_max}),
      distance = GREATEST(1.0 / (weight + ${system.tick.reorganization_strength} + ${system.tick.distance_epsilon}), ${system.node_edge.edge_weight_min})
  WHERE lock IS NOT TRUE
    AND weight > ${system.node_edge.potential_threshold}
`

/**
 * Memory reorganization step 3.
 * Role: Prunes too-weak edges after consolidation updates.
 */
export const sql_reorg_delete_too_weak_edges = `
  DELETE FROM ${app.db.schema_brain}.edges
  WHERE weight < ${system.node_edge.weak_edge_threshold}
    AND lock IS NOT TRUE
`

/**
 * Counts the number of currently active nodes.
 * Role: Used to calculate system heat (load) for homeostatic plasticity and overload detection.
 */
export const sql_get_active_node_count = `
  SELECT COUNT(*) as count
  FROM ${app.db.schema_brain}.nodes
  WHERE is_active = TRUE
`

/**
 * Memory reorganization triggered by idle state.
 * Role: Simulates brain's memory consolidation during rest - weakens unused connections, reinforces important ones.
 * Unlike time-based decay, this is triggered by new learning events going idle.
 * Synchronously updates distance to reflect synaptic efficiency changes.
 */
export const sql_memory_reorganization = `
	${sql_sleep_tick_begin};

	UPDATE ${app.db.schema_brain}.edges
	SET weight = GREATEST(weight * ${system.tick.decay_strength}, ${system.node_edge.weak_edge_threshold}),
	    distance = GREATEST(1.0 / (weight * ${system.tick.decay_strength} + ${system.tick.distance_epsilon}), 0.1)
	WHERE (lock IS NULL OR lock = FALSE)
	  AND weight < 0.5;

	UPDATE ${app.db.schema_brain}.edges
	SET weight = LEAST(weight + ${system.tick.reorganization_strength}, ${system.node_edge.edge_weight_max}),
	    distance = GREATEST(1.0 / (weight + ${system.tick.reorganization_strength} + ${system.tick.distance_epsilon}), 0.1)
	WHERE (lock IS NULL OR lock = FALSE)
	  AND weight > 0.5;

	DELETE FROM ${app.db.schema_brain}.edges
	WHERE weight < ${system.node_edge.weak_edge_threshold}
	  AND (lock IS NULL OR lock = FALSE);

	${sql_sleep_tick_commit};
`

/**
 * Strengthens edges for a set of context ids.
 * Role: Reinforces replayed context trajectories during consolidation.
 */
export const sql_strengthen_edges_by_context = `
	UPDATE ${app.db.schema_brain}.edges
	SET weight = LEAST(weight + $1, ${system.node_edge.edge_weight_max}),
	    distance = GREATEST(1.0 / (LEAST(weight + $1, ${system.node_edge.edge_weight_max}) + ${system.tick.distance_epsilon}), 0.1),
	    updated_at = CURRENT_TIMESTAMP
	WHERE context_id = ANY($2)
	  AND (lock IS NULL OR lock = FALSE)
`
