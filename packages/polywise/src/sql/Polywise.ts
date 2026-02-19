import {
	DEFAULT_HEBBIAN_REWARD,
	EDGE_DECAY_FACTOR,
	EDGE_DISTANCE_MIN,
	EDGE_LEARNING_FACTOR,
	EDGE_WEIGHT_MAX,
	EDGE_WEIGHT_MIN,
	NODE_POTENTIAL_MIN,
	SCHEMA_BRAIN,
	SCHEMA_MEMORY,
	SNAPSHOT_EDGES_LIMIT,
	TICK_DECAY_RATE,
	TICK_POTENTIAL_MAX
} from '../consts'

/**
 * The core simulation step for the neural graph.
 * Role:
 * 1. Propagates activation: Nodes fire if they cross a threshold, sending signals to connected neighbors.
 * 2. Updates node states: Adjusts potential based on input, decay, and firing (reset).
 * 3. Updates edge weights: Implements Hebbian learning (strengthens active-active connections) and decay (weakens unused ones).
 * 4. Adjusts distances: Recalculates "distance" (cost) based on weight for pathfinding.
 */
export const sql_tick = (threshold: number) => `
  WITH incoming_signals AS (
    SELECT 
      e.target_id, 
      SUM(
        n.activation * e.weight * (1.0 / (1.0 + ln(1.0 + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.updated_at)) / 86400.0))) / (e.distance + 0.1)
      ) as total_input
    FROM ${SCHEMA_BRAIN}.edges e
    JOIN ${SCHEMA_BRAIN}.nodes n ON e.source_id = n.id
    WHERE n.activation > 0
    GROUP BY e.target_id
  )
  UPDATE ${SCHEMA_BRAIN}.nodes
  SET potential = LEAST(potential + COALESCE((SELECT total_input FROM incoming_signals WHERE incoming_signals.target_id = ${SCHEMA_BRAIN}.nodes.id), 0), ${TICK_POTENTIAL_MAX});

  UPDATE ${SCHEMA_BRAIN}.nodes
  SET 
    activation = CASE WHEN potential > ${threshold} THEN 1.0 ELSE 0.0 END,
    potential = CASE WHEN potential > ${threshold} THEN 0.0 ELSE potential * ${TICK_DECAY_RATE} END,
    last_fired_at = CASE WHEN potential > ${threshold} THEN CURRENT_TIMESTAMP ELSE last_fired_at END,
    updated_at = CASE WHEN potential > ${threshold} THEN CURRENT_TIMESTAMP ELSE updated_at END;

  UPDATE ${SCHEMA_BRAIN}.edges e
  SET 
    weight = CASE 
      WHEN (SELECT activation FROM ${SCHEMA_BRAIN}.nodes WHERE id = e.source_id) > 0 
           AND (SELECT activation FROM ${SCHEMA_BRAIN}.nodes WHERE id = e.target_id) > 0 
      THEN LEAST(weight + (${EDGE_LEARNING_FACTOR} * e.learning_rate), ${EDGE_WEIGHT_MAX})
      ELSE GREATEST(weight - (${EDGE_DECAY_FACTOR} / e.decay_resistance), ${EDGE_WEIGHT_MIN})
    END,
    updated_at = CASE 
      WHEN (SELECT activation FROM ${SCHEMA_BRAIN}.nodes WHERE id = e.source_id) > 0 
           AND (SELECT activation FROM ${SCHEMA_BRAIN}.nodes WHERE id = e.target_id) > 0 
      THEN CURRENT_TIMESTAMP 
      ELSE updated_at 
    END;

  UPDATE ${SCHEMA_BRAIN}.edges
  SET distance = GREATEST(1.0 / (weight + 0.1), ${EDGE_DISTANCE_MIN});
`

/**
 * Creates a new node in the graph.
 * Role: Instantiates a new concept or entity within the brain.
 */
export const sql_add_node = `
  INSERT INTO ${SCHEMA_BRAIN}.nodes (id, label, x, y, threshold, idol_id, root_ids, metrics_ids, metadata, embedding)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING id
`

/**
 * Creates a directed edge between two nodes.
 * Role: Establishes a relationship or association between two concepts.
 */
export const sql_connect = `
  INSERT INTO ${SCHEMA_BRAIN}.edges (id, source_id, target_id, weight, idol_id, root_ids, metrics_ids, metadata)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`

/**
 * Manually injects potential into a specific node.
 * Role: Provides external stimulation or "attention" to a concept.
 */
export const sql_stimulate = `UPDATE ${SCHEMA_BRAIN}.nodes SET potential = potential + $1 WHERE id = $2`

/**
 * Retrieves a snapshot of active or significant nodes.
 * Role: Captures the current "state of mind" for visualization or analysis, filtering out dormant nodes.
 */
export const sql_get_snapshot_nodes = (weight_threshold: number) => `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE potential > ${NODE_POTENTIAL_MIN}
  OR id IN (SELECT source_id FROM ${SCHEMA_BRAIN}.edges WHERE weight > ${weight_threshold})
  OR id IN (SELECT target_id FROM ${SCHEMA_BRAIN}.edges WHERE weight > ${weight_threshold})
`

/**
 * Retrieves a snapshot of significant edges.
 * Role: Captures the active wiring of the brain for visualization or analysis.
 */
export const sql_get_snapshot_edges = (weight_threshold: number) => `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.edges
  WHERE weight > ${weight_threshold}
  ORDER BY weight DESC
  LIMIT ${SNAPSHOT_EDGES_LIMIT}
`

/**
 * Inserts a new article into the knowledge base.
 * Role: Ingests raw textual knowledge/content into the system.
 */
export const sql_process_article = `
  INSERT INTO ${SCHEMA_MEMORY}.articles (id, content, idol_id, root_ids, metrics_ids, metadata) 
  VALUES ($1, $2, $3, $4, $5, $6) 
  RETURNING id, content, created_at
`

/**
 * Inserts a new node or updates an existing one, boosting its potential.
 * Role: Ensures a concept exists and reinforces it (learning), triggering activation if it's already present.
 */
export const sql_upsert_node = `
  INSERT INTO ${SCHEMA_BRAIN}.nodes (id, label, x, y, potential, idol_id, root_ids, metrics_ids, metadata, embedding)
  VALUES ($1, $2, random() * 800, random() * 600, 1.0, $3, $4, $5, $6, $7)
  ON CONFLICT (label) DO UPDATE SET 
    potential = LEAST(${SCHEMA_BRAIN}.nodes.potential + ${DEFAULT_HEBBIAN_REWARD}, ${TICK_POTENTIAL_MAX}), 
    metadata = ${SCHEMA_BRAIN}.nodes.metadata || EXCLUDED.metadata, 
    embedding = COALESCE(EXCLUDED.embedding, ${SCHEMA_BRAIN}.nodes.embedding), 
    idol_id = COALESCE(EXCLUDED.idol_id, ${SCHEMA_BRAIN}.nodes.idol_id),
    root_ids = CASE WHEN EXCLUDED.root_ids IS NOT NULL THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(${SCHEMA_BRAIN}.nodes.root_ids, '{}') || EXCLUDED.root_ids))) ELSE ${SCHEMA_BRAIN}.nodes.root_ids END,
    metrics_ids = CASE WHEN EXCLUDED.metrics_ids IS NOT NULL THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(${SCHEMA_BRAIN}.nodes.metrics_ids, '{}') || EXCLUDED.metrics_ids))) ELSE ${SCHEMA_BRAIN}.nodes.metrics_ids END,
    updated_at = CURRENT_TIMESTAMP;
`

/**
 * Performs a full-text search on articles using PostgreSQL's text search vectors.
 * Role: Traditional keyword-based document retrieval.
 */
export const sql_search_articles_by_text = `
  SELECT id, content, created_at, updated_at, metadata,
    ts_rank(to_tsvector('english', coalesce(content,'')), websearch_to_tsquery('english', $1)) AS rank
  FROM ${SCHEMA_MEMORY}.articles
  WHERE to_tsvector('english', coalesce(content,'')) @@ websearch_to_tsquery('english', $1)
    AND ($3::text IS NULL OR idol_id = $3)
    AND ($4::text[] IS NULL OR root_ids && $4)
    AND ($5::text[] IS NULL OR metrics_ids && $5)
  ORDER BY rank DESC
  LIMIT $2
`

/**
 * Begins a transaction for batch triple injection.
 * Role: Ensures atomicity when ingesting large sets of structured knowledge (triples).
 */
export const sql_inject_triples_begin = `BEGIN`

/**
 * Inserts a new edge derived from a triple (Subject-Predicate-Object) if it doesn't exist.
 * Role: Translates structured knowledge into graph connections.
 */
export const sql_inject_triples_insert_edge = (
	sub_id: string,
	obj_id: string,
	learning_rate: number,
	decay_resistance: number,
	predicate: string,
	weight: number,
	idol_id?: string | null,
	root_ids?: string[] | null,
	metrics_ids?: string[] | null,
	metadata?: any
) => `
  INSERT INTO ${SCHEMA_BRAIN}.edges (id, source_id, target_id, learning_rate, decay_resistance, type, weight, idol_id, root_ids, metrics_ids, metadata)
  SELECT '${sub_id}_${obj_id}', '${sub_id}', '${obj_id}', ${learning_rate}, ${decay_resistance}, '${predicate}', ${weight}, ${idol_id ? `'${idol_id}'` : 'NULL'}, ${root_ids && root_ids.length > 0 ? `ARRAY[${root_ids.map(id => `'${id}'`).join(',')}]` : 'NULL'}, ${metrics_ids && metrics_ids.length > 0 ? `ARRAY[${metrics_ids.map(id => `'${id}'`).join(',')}]` : 'NULL'}, '${JSON.stringify(metadata ?? {})}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM ${SCHEMA_BRAIN}.edges WHERE source_id = '${sub_id}' AND target_id = '${obj_id}');
`

/**
 * Updates an existing edge derived from a triple.
 * Role: Reinforces and updates metadata/properties of existing knowledge connections.
 */
export const sql_inject_triples_update_edge = (
	sub_id: string,
	obj_id: string,
	learning_rate: number,
	decay_resistance: number,
	weight: number,
	idol_id?: string | null,
	root_ids?: string[] | null,
	metrics_ids?: string[] | null,
	metadata?: any
) => {
	const has_root_ids = Boolean(root_ids && root_ids.length > 0)
	const has_metrics_ids = Boolean(metrics_ids && metrics_ids.length > 0)
	const root_ids_array = has_root_ids ? `ARRAY[${root_ids!.map(id => `'${id}'`).join(',')}]` : 'NULL'
	const metrics_ids_array = has_metrics_ids ? `ARRAY[${metrics_ids!.map(id => `'${id}'`).join(',')}]` : 'NULL'

	return `
  UPDATE ${SCHEMA_BRAIN}.edges
  SET
    learning_rate = GREATEST(learning_rate, ${learning_rate}),
    decay_resistance = GREATEST(decay_resistance, ${decay_resistance}),
    weight = LEAST(weight + ${weight}, 5.0),
    idol_id = COALESCE(${idol_id ? `'${idol_id}'` : 'NULL'}, idol_id),
    root_ids = CASE WHEN ${has_root_ids} THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(root_ids, '{}') || ${root_ids_array}))) ELSE root_ids END,
    metrics_ids = CASE WHEN ${has_metrics_ids} THEN (SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(metrics_ids, '{}') || ${metrics_ids_array}))) ELSE metrics_ids END,
    metadata = metadata || '${JSON.stringify(metadata ?? {})}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
  WHERE source_id = '${sub_id}' AND target_id = '${obj_id}';
`
}

/**
 * Commits the triple injection transaction.
 * Role: Finalizes the bulk knowledge ingestion.
 */
export const sql_inject_triples_commit = `COMMIT`

/**
 * Rolls back the triple injection transaction.
 * Role: Restores database consistency when any step in batch triple ingestion fails.
 */
export const sql_inject_triples_rollback = `ROLLBACK`

/**
 * Helper query to find a node ID by label during upsert.
 * Role: Internal check to determine if an insert or update is needed.
 */
export const sql_upsert_node_select = `SELECT id FROM ${SCHEMA_BRAIN}.nodes WHERE label = $1`

/**
 * Links a node to its source article.
 * Role: Establishes provenance, allowing the system to trace concepts back to the documents that generated them.
 */
export const sql_node_sources = `INSERT INTO ${SCHEMA_BRAIN}.node_sources (node_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`

/**
 * Retrieves all nodes associated with a specific Idol (namespace/context).
 * Role: Scoped retrieval for multi-tenant or multi-context operations.
 */
/**
 * Retrieves all nodes associated with a specific Idol (namespace/context).
 * Role: Scoped retrieval for multi-tenant or multi-context operations.
 */
export const sql_get_nodes_by_idol = `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE idol_id = $1
`

/**
 * Retrieves all nodes associated with a specific Root ID (grouping).
 * Role: Hierarchical or group-based retrieval.
 */
export const sql_get_nodes_by_root = `
  SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE $1 = ANY(root_ids)
`

/**
 * Retrieves all edges associated with a specific Idol.
 * Role: Context-scoped structure retrieval.
 */
export const sql_get_edges_by_idol = `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.edges
  WHERE idol_id = $1
`

/**
 * Retrieves all edges associated with a specific Root ID.
 * Role: Group-scoped structure retrieval.
 */
export const sql_get_edges_by_root = `
  SELECT source_id, target_id, weight, distance, type, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
  FROM ${SCHEMA_BRAIN}.edges
  WHERE $1 = ANY(root_ids)
`

/**
 * Stores the vector embedding for an article.
 * Role: Enables semantic search by mapping article content to a vector space.
 */
export const sql_insert_article_embedding = `
  INSERT INTO ${SCHEMA_MEMORY}.article_embeddings (id, article_id, embedding)
  VALUES ($1, $2, $3)
  RETURNING id
`

/**
 * Retrieves the stored embedding for an article.
 * Role: Used for re-indexing or analysis.
 */
export const sql_get_article_embedding = `SELECT embedding FROM ${SCHEMA_MEMORY}.article_embeddings WHERE article_id = $1`

/**
 * Searches for articles similar to a query vector.
 * Role: The core of the RAG (Retrieval-Augmented Generation) system, finding relevant knowledge based on meaning.
 */
export const sql_search_articles_by_vector = `
  SELECT 
    a.id,
    a.content,
    a.created_at,
    a.updated_at,
    a.metadata,
    1 - (e.embedding <=> $1) AS similarity
  FROM ${SCHEMA_MEMORY}.articles a
  JOIN ${SCHEMA_MEMORY}.article_embeddings e ON a.id = e.article_id
  WHERE ($3::text IS NULL OR a.idol_id = $3)
    AND ($4::text[] IS NULL OR a.root_ids && $4)
    AND ($5::text[] IS NULL OR a.metrics_ids && $5)
    AND (1 - (e.embedding <=> $1)) > $6
  ORDER BY e.embedding <=> $1
  LIMIT $2
`

/**
 * Retrieves the full content of a single article.
 * Role: Reading the actual text after a search result.
 */
export const sql_get_article = `SELECT id, content, created_at FROM ${SCHEMA_MEMORY}.articles WHERE id = $1`

/**
 * Retrieves all articles (metadata only).
 * Role: Bulk export or maintenance listing.
 */
export const sql_get_all_articles = `SELECT id, content, created_at FROM ${SCHEMA_MEMORY}.articles ORDER BY created_at DESC`

/**
 * Updates an article's content and metadata with filter validation.
 * Role: Correction or refinement of stored memory with full metadata support and security filtering.
 */
export const sql_update_article = `
  UPDATE ${SCHEMA_MEMORY}.articles 
  SET content = $2,
      idol_id = COALESCE($3, idol_id),
      root_ids = COALESCE($4, root_ids),
      metrics_ids = COALESCE($5, metrics_ids),
      metadata = COALESCE($6, metadata),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 
    AND ($7::text IS NULL OR idol_id = $7)
    AND ($8::text[] IS NULL OR root_ids && $8)
    AND ($9::text[] IS NULL OR metrics_ids && $9)
  RETURNING id, content, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at
`

/**
 * Finds the node most semantically similar to a query vector.
 * Role: "Grounding" - mapping an abstract vector/thought to a concrete concept node in the graph.
 */
export const sql_find_nearest_node = `
  SELECT id, label, activation, potential, threshold, metadata, 1 - (embedding <=> $1) AS similarity
  FROM ${SCHEMA_BRAIN}.nodes
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1
  LIMIT 1
`

/**
 * Updates the vector embedding of a node.
 * Role: Refining the semantic meaning of a concept node.
 */
export const sql_update_node_embedding = `UPDATE ${SCHEMA_BRAIN}.nodes SET embedding = $1 WHERE id = $2`

/**
 * Retrieves all nodes.
 * Role: Full system dump/backup.
 */
export const sql_get_all_nodes = `SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata, created_at, updated_at FROM ${SCHEMA_BRAIN}.nodes`

/**
 * Updates an article's embedding vector.
 * Role: Re-indexing content after updates or model changes.
 */
export const sql_update_article_embedding = `UPDATE ${SCHEMA_MEMORY}.article_embeddings SET embedding = $1 WHERE article_id = $2`

/**
 * Deletes an article and its associated embedding (via CASCADE) with filter validation.
 * Role: Removes a memory and all related data including node_sources references with security filtering.
 */
export const sql_delete_article = `
  DELETE FROM ${SCHEMA_MEMORY}.articles 
  WHERE id = $1 
    AND ($2::text IS NULL OR idol_id = $2)
    AND ($3::text[] IS NULL OR root_ids && $3)
    AND ($4::text[] IS NULL OR metrics_ids && $4)
`

/**
 * Decays the potential of nodes associated with a deleted article.
 * Role: Weakens concepts that were derived from the forgotten memory.
 */
export const sql_forget_decay_nodes = `
  UPDATE ${SCHEMA_BRAIN}.nodes n
  SET potential = GREATEST(n.potential * 0.5, 0),
      activation = GREATEST(n.activation * 0.5, 0)
  WHERE n.id IN (
    SELECT node_id FROM ${SCHEMA_BRAIN}.node_sources WHERE article_id = $1
  )
`

/**
 * Decays the weight of edges connected to nodes from a deleted article.
 * Role: Weakens associations between concepts that were linked through the forgotten memory.
 */
export const sql_forget_decay_edges = `
  UPDATE ${SCHEMA_BRAIN}.edges e
  SET weight = GREATEST(e.weight * 0.5, 0.001)
  WHERE e.source_id IN (
    SELECT node_id FROM ${SCHEMA_BRAIN}.node_sources WHERE article_id = $1
  )
  OR e.target_id IN (
    SELECT node_id FROM ${SCHEMA_BRAIN}.node_sources WHERE article_id = $1
  )
`
