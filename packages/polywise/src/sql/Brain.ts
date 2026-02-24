import {
	DECAY_STRENGTH,
	DISTANCE_EPSILON,
	EDGE_DECAY_RATE,
	EDGE_INACTIVE_DAYS,
	EDGE_WEIGHT_MAX,
	NODE_DECAY_RATE,
	NODE_INACTIVE_DAYS,
	REORGANIZATION_STRENGTH,
	SCHEMA_BRAIN,
	SCHEMA_MEMORY,
	WEAK_EDGE_THRESHOLD,
	WEIGHT_DEATH_THRESHOLD
} from '../consts'

/**
 * Randomly increases the potential of a small subset (1%) of nodes.
 * Role: Simulates background neural noise or "shadow" activity to prevent system stagnation and enable spontaneous activation.
 */
export const sql_run_shadow_tick = `
  UPDATE ${SCHEMA_BRAIN}.nodes 
  SET potential = potential + 0.1 
  WHERE id IN (SELECT id FROM ${SCHEMA_BRAIN}.nodes ORDER BY random() LIMIT (SELECT count(*)/100 + 1 FROM ${SCHEMA_BRAIN}.nodes));
`

/**
 * Begins the sleep cycle transaction.
 * Role: Ensures atomicity of the sleep maintenance operations (decay, replay, pruning).
 */
export const sql_sleep_tick_begin = `BEGIN`

/**
 * Removes edges with negligible weight.
 * Role: Neural pruning mechanism to remove unused or insignificant connections, optimizing graph size and traversal performance.
 * Triggered by: Cognitive overload (hot nodes > MAX_HOT_NODES).
 */
export const sql_sleep_tick_clean_noise = `
  DELETE FROM ${SCHEMA_BRAIN}.edges 
  WHERE weight < ${WEIGHT_DEATH_THRESHOLD}; 
`

/**
 * Decays the weight of weak and inactive edges.
 * Role: Implements selective synaptic decay - only decays edges that are both low-weight and long-inactive.
 * This mimics synaptic homeostasis where weak, unused connections are pruned during cognitive overload.
 * Triggered by: Cognitive overload (hot nodes > MAX_HOT_NODES).
 */
export const sql_sleep_tick_decay_edges = `
  UPDATE ${SCHEMA_BRAIN}.edges
  SET 
    weight = weight * (1.0 - ${EDGE_DECAY_RATE}),
    distance = 1.0 / (weight * (1.0 - ${EDGE_DECAY_RATE}) + ${DISTANCE_EPSILON}),
    updated_at = CURRENT_TIMESTAMP
  WHERE 
    lock = FALSE
    AND weight < 0.5
    AND updated_at < NOW() - INTERVAL '${EDGE_INACTIVE_DAYS} days';
`

/**
 * Strengthens a random subset of high-learning-rate edges.
 * Role: Simulates "memory replay" or consolidation during sleep, reinforcing important (high learning rate) connections.
 */
export const sql_sleep_tick_replay = `
  UPDATE ${SCHEMA_BRAIN}.edges 
  SET weight = LEAST(weight + 0.2, 5.0)
  WHERE id IN (
    SELECT id FROM ${SCHEMA_BRAIN}.edges 
    WHERE learning_rate > 1.5 
    ORDER BY random() LIMIT 5
  );
`

/**
 * Decays the potential of inactive nodes.
 * Role: Implements selective node decay - only decays nodes that are low-potential and long-inactive.
 * This mimics synaptic homeostasis where inactive neural pathways are downregulated during cognitive overload.
 * Triggered by: Cognitive overload (hot nodes > MAX_HOT_NODES).
 */
export const sql_sleep_tick_decay_nodes = `
  UPDATE ${SCHEMA_BRAIN}.nodes
  SET potential = potential * ${NODE_DECAY_RATE},
      updated_at = CURRENT_TIMESTAMP
  WHERE 
    lock = FALSE
    AND potential < 0.5
    AND updated_at < NOW() - INTERVAL '${NODE_INACTIVE_DAYS} days';
`

/**
 * Commits the sleep cycle transaction.
 * Role: Finalizes the sleep maintenance operations.
 */
export const sql_sleep_tick_commit = `COMMIT`

/**
 * Retrieves nodes matching a text label pattern.
 * Role: Keyword-based memory retrieval entry point, allowing the system to recall concepts by name.
 */
export const sql_recall_nodes_by_label = `
	SELECT id, label, x, y, potential, idol_id, root_ids, metrics_ids, created_at, updated_at
	FROM ${SCHEMA_BRAIN}.nodes
	WHERE (label ILIKE $1 OR $1 ILIKE '%' || label || '%')
	  AND ($3::text IS NULL OR idol_id = $3)
	  AND ($4::text[] IS NULL OR root_ids && $4)
	  AND ($5::text[] IS NULL OR metrics_ids && $5)
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
		FROM ${SCHEMA_BRAIN}.edges
		WHERE source_id = ANY($1) OR target_id = ANY($1)
		
		UNION ALL
		
		SELECT e.source_id, e.target_id, e.weight, sg.depth + 1
		FROM ${SCHEMA_BRAIN}.edges e
		JOIN search_graph sg ON (e.source_id = sg.target_id OR e.target_id = sg.source_id)
		WHERE sg.depth < $2
		AND e.weight > 0.2
	)
	SELECT DISTINCT n.id, n.label, n.x, n.y, n.potential, n.idol_id, n.root_ids, n.metrics_ids, n.created_at, n.updated_at
	FROM ${SCHEMA_BRAIN}.nodes n
	JOIN (
		SELECT DISTINCT source_id as nid FROM search_graph
		UNION
		SELECT DISTINCT target_id as nid FROM search_graph
	) connected ON n.id = connected.nid
	ORDER BY n.potential DESC
	LIMIT $3
`

/**
 * Increases the potential of a batch of nodes.
 * Role: Simulates "attention" or "stimulation" from external sources or internal processes, priming these nodes for activation.
 */
export const sql_stimulate_nodes_batch = `
	UPDATE ${SCHEMA_BRAIN}.nodes
	SET potential = LEAST(potential + $1, 2.0),
	    updated_at = CURRENT_TIMESTAMP
	WHERE id = ANY($2)
`

/**
 * Retrieves original content articles associated with specific nodes.
 * Role: Grounds abstract node concepts back to their source knowledge/text for detailed retrieval.
 */
export const sql_get_node_articles = `
	SELECT DISTINCT a.id, a.content
	FROM ${SCHEMA_MEMORY}.articles a
	JOIN ${SCHEMA_BRAIN}.node_sources ns ON a.id = ns.article_id
	WHERE ns.node_id = ANY($1)
`

/**
 * Increases the weight of a specific edge.
 * Role: Implements Hebbian learning ("neurons that fire together wire together"), strengthening connections between simultaneously active concepts.
 */
export const sql_strengthen_edge = `
	UPDATE ${SCHEMA_BRAIN}.edges
	SET weight = LEAST(weight + $1, 5.0),
	    updated_at = CURRENT_TIMESTAMP
	WHERE source_id = $2 AND target_id = $3
`

/**
 * Batch update to strengthen bidirectional connections between groups of nodes.
 * Role: Efficiently reinforces associations between multiple concepts at once.
 */
export const sql_strengthen_edges_batch = `
	UPDATE ${SCHEMA_BRAIN}.edges
	SET weight = LEAST(weight + $1, 5.0),
	    updated_at = CURRENT_TIMESTAMP
	WHERE (source_id = ANY($2) AND target_id = ANY($3))
	   OR (source_id = ANY($3) AND target_id = ANY($2))
`

/**
 * Selects nodes with potential above a certain threshold.
 * Role: Identifies the currently active "thoughts" or high-priority concepts in the global workspace.
 */
export const sql_get_high_potential_nodes = `
	SELECT id, label, x, y, potential, idol_id, root_ids, metrics_ids, created_at, updated_at
	FROM ${SCHEMA_BRAIN}.nodes
	WHERE potential > $1
	ORDER BY potential DESC
	LIMIT $2
`

/**
 * Retrieves a single node's details by its ID.
 * Role: Precise lookup for node attributes.
 */
export const sql_get_node_by_id = `
	SELECT id, label, x, y, potential, idol_id, root_ids, metrics_ids, created_at, updated_at
	FROM ${SCHEMA_BRAIN}.nodes
	WHERE id = $1
`

/**
 * Finds a node's ID given its label.
 * Role: Key lookup for checking existence or getting ID for linking.
 */
export const sql_get_node_by_label = `SELECT id FROM ${SCHEMA_BRAIN}.nodes WHERE label = $1`

/**
 * Retrieves all edges connecting a set of nodes.
 * Role: Reconstructs the local graph structure for a set of recalled concepts.
 */
export const sql_get_edges_between_nodes = `
	SELECT id, source_id, target_id, weight, distance, learning_rate, decay_resistance, idol_id, root_ids, metrics_ids, created_at, updated_at
	FROM ${SCHEMA_BRAIN}.edges
	WHERE source_id = ANY($1) AND target_id = ANY($1)
`

/**
 * Memory reorganization triggered by idle state.
 * Role: Simulates brain's memory consolidation during rest - weakens unused connections, reinforces important ones.
 * Unlike time-based decay, this is triggered by new learning events going idle.
 * Synchronously updates distance to reflect synaptic efficiency changes.
 */
export const sql_memory_reorganization = `
	BEGIN;

	UPDATE ${SCHEMA_BRAIN}.edges
	SET weight = GREATEST(weight * ${DECAY_STRENGTH}, ${WEAK_EDGE_THRESHOLD}),
	    distance = GREATEST(1.0 / (weight * ${DECAY_STRENGTH} + ${DISTANCE_EPSILON}), 0.1)
	WHERE (lock IS NULL OR lock = FALSE)
	  AND weight < 0.5;

	UPDATE ${SCHEMA_BRAIN}.edges
	SET weight = LEAST(weight + ${REORGANIZATION_STRENGTH}, ${EDGE_WEIGHT_MAX}),
	    distance = GREATEST(1.0 / (weight + ${REORGANIZATION_STRENGTH} + ${DISTANCE_EPSILON}), 0.1)
	WHERE (lock IS NULL OR lock = FALSE)
	  AND weight > 0.5;

	DELETE FROM ${SCHEMA_BRAIN}.edges
	WHERE weight < ${WEAK_EDGE_THRESHOLD}
	  AND (lock IS NULL OR lock = FALSE);

	COMMIT;
`

/**
 * Counts nodes with potential above the hot threshold.
 * Role: Used to determine if cognitive overload has occurred, triggering selective decay.
 */
export const sql_get_hot_node_count = (threshold: number) => `
	SELECT COUNT(*) as count
	FROM ${SCHEMA_BRAIN}.nodes
	WHERE potential > ${threshold}
`
