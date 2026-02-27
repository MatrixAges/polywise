import { app, system } from '../consts'

const sql_propagate_node_input_cte = `
  WITH active_nodes AS (
    SELECT id, is_active
    FROM ${app.schema_brain}.nodes
  ),
  incoming_signals AS (
    SELECT
      e.target_id,
      SUM(
        CASE WHEN src.is_active THEN n.transmitter ELSE 0.0 END
        * e.weight
        * ${system.global_decay_rate}
        / (e.distance + 0.1)
      ) AS total_input
    FROM ${app.schema_brain}.edges e
    JOIN ${app.schema_brain}.nodes n ON n.id = e.source_id
    JOIN active_nodes src ON src.id = e.source_id
    WHERE src.is_active = TRUE
    GROUP BY e.target_id
  )
`

const buildNodeInputUpdateSql = (inhibition_factor: number) => `
  ${sql_propagate_node_input_cte}
  UPDATE ${app.schema_brain}.nodes nd
  SET potential = LEAST(
    GREATEST(
      nd.potential + COALESCE(sig.total_input, 0) * (1 - ${inhibition_factor}),
      ${system.min_potential}
    ),
    ${system.tick_potential_max}
  )
  FROM incoming_signals sig
  WHERE nd.id = sig.target_id;
`

const buildNodeStateUpdateSql = (threshold: number, threshold_decrement: number) => `
  WITH node_eval AS (
    SELECT
      id,
      is_active,
      potential,
      current_threshold,
      last_fired_at,
      (
        potential > current_threshold
        AND (
          last_fired_at IS NULL
          OR EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_fired_at)) * 1000 > ${system.refractory_period_ms}
        )
      ) AS can_fire
    FROM ${app.schema_brain}.nodes
  )
  UPDATE ${app.schema_brain}.nodes nd
  SET
    potential = CASE
      WHEN nd.lock IS TRUE THEN nd.potential
      WHEN ev.is_active THEN 0
      ELSE nd.potential * ${system.tick_decay_rate}
    END,
    current_threshold = CASE
      WHEN ev.is_active THEN LEAST(nd.current_threshold + ${system.threshold_spike}, ${system.max_threshold})
      ELSE GREATEST(nd.current_threshold - ${threshold_decrement}, ${system.min_threshold}, ${threshold})
    END,
    transmitter = CASE
      WHEN ev.is_active THEN GREATEST(nd.transmitter - 0.2, 0.0)
      ELSE LEAST(nd.transmitter + 0.05, 1.0)
    END,
    is_active = CASE
      WHEN ev.is_active THEN FALSE
      WHEN ev.can_fire THEN TRUE
      ELSE FALSE
    END,
    last_fired_at = CASE
      WHEN NOT ev.is_active AND ev.can_fire THEN CURRENT_TIMESTAMP
      ELSE nd.last_fired_at
    END,
    updated_at = CASE
      WHEN NOT ev.is_active AND ev.can_fire THEN CURRENT_TIMESTAMP
      ELSE nd.updated_at
    END
  FROM node_eval ev
  WHERE nd.id = ev.id;
`

const buildEdgeLearningUpdateSql = (arousal: number) => `
  WITH active_nodes AS (
    SELECT id, is_active
    FROM ${app.schema_brain}.nodes
  ),
  edge_activity AS (
    SELECT
      e.id,
      e.weight,
      e.learning_rate,
      e.lock,
      src.is_active AS source_active,
      tgt.is_active AS target_active
    FROM ${app.schema_brain}.edges e
    JOIN active_nodes src ON src.id = e.source_id
    JOIN active_nodes tgt ON tgt.id = e.target_id
  ),
  edge_next AS (
    SELECT
      id,
      source_active,
      target_active,
      CASE
        WHEN lock IS TRUE THEN weight
        WHEN source_active AND target_active THEN LEAST(
          weight + (${system.edge_learning_factor} * learning_rate * ${arousal} * (1 - weight / ${system.edge_weight_max})),
          ${system.edge_weight_max}
        )
        WHEN source_active OR target_active THEN GREATEST(
          weight - (${system.edge_decay_factor} * learning_rate),
          ${system.edge_weight_min}
        )
        ELSE weight
      END AS next_weight
    FROM edge_activity
  )
  UPDATE ${app.schema_brain}.edges e
  SET
    weight = nx.next_weight,
    distance = GREATEST(1.0 / (nx.next_weight + ${system.distance_epsilon}), 0.1),
    reaction_count = e.reaction_count + CASE WHEN nx.source_active AND nx.target_active THEN 1 ELSE 0 END,
    updated_at = CASE WHEN nx.source_active OR nx.target_active THEN CURRENT_TIMESTAMP ELSE e.updated_at END
  FROM edge_next nx
  WHERE e.id = nx.id;
`

/**
 * The core simulation step for the neural graph.
 * Role:
 * 1. Propagates activation signals into node potential.
 * 2. Updates node dynamic state (fire/reset/decay/threshold/transmitter).
 * 3. Optionally applies Hebbian edge learning and distance sync.
 */
export const sql_propagate = (
	threshold: number,
	threshold_decrement: number,
	is_learning: boolean = false,
	arousal: number = 1.0,
	inhibition_factor: number = 0
) => {
	const node_input_sql = buildNodeInputUpdateSql(inhibition_factor)
	const node_state_sql = buildNodeStateUpdateSql(threshold, threshold_decrement)
	const edge_learning_sql = is_learning ? buildEdgeLearningUpdateSql(arousal) : ''

	return `
    ${node_input_sql}
    ${node_state_sql}
    ${edge_learning_sql}
  `
}

/**
 * Decays the weight of edges over time (LTD - Long-Term Depression).
 * Role: Implements forgetting for inactive connections and synchronizes distance.
 */
export const sql_decay = `
  UPDATE ${app.schema_brain}.edges
  SET weight = GREATEST(weight - (${system.edge_decay_factor} / decay_resistance), ${system.edge_weight_min}),
      distance = GREATEST(1.0 / (GREATEST(weight - (${system.edge_decay_factor} / decay_resistance), ${system.edge_weight_min}) + ${system.distance_epsilon}), 0.1)
  WHERE (lock IS NULL OR lock = FALSE);
`

/**
 * Manually injects potential into a specific node.
 * Role: Provides external stimulation to a target concept node.
 */
export const sql_stimulate = `UPDATE ${app.schema_brain}.nodes SET potential = potential + $1 WHERE id = $2`
