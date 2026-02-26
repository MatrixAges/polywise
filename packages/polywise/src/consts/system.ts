export const timing = {
	shadow_interval_ms: 60 * 1000,
	idle_timeout_ms: 5 * 60 * 1000,
	idle_decay_threshold_ms: 3 * 60 * 1000,
	refractory_period_ms: 500
} as const

export const default_config = {
	default_recall_depth: 2,
	default_search_limit: 30,
	default_rerank_limit: 30,
	default_stimulate_intensity: 0.3,
	default_node_threshold: 0.5,
	default_hebbian_reward: 0.5,
	default_edge_weight: 0.1,
	default_similarity_threshold: 0.1
} as const

export const snapshot = {
	snapshot_weight_threshold: 0.2,
	snapshot_edges_limit: 500,
	snapshot_nodes_limit: 60
} as const

export const context = {
	context_keywords_limit: 8,
	context_similarity_threshold: 0.75,
	context_query_threshold: 0.65,
	context_query_limit: 1,
	context_sequence_depth: 3,
	context_sequence_branch: 3,
	context_sequence_hop_decay: 0.6,
	context_sequence_time_half_life_hours: 24,
	context_sequence_window_hours: 6,
	context_sequence_window_penalty: 0.8,
	context_sequence_replay_limit: 1,
	context_sequence_replay_min_score: 1.0,
	context_sequence_replay_strength: 0.12,
	query_keywords_limit: 8,
	search_limit_factor: 2
} as const

export const recall = {
	recency_half_life_days: 7,
	recency_min_weight: 0.4,
	recency_max_weight: 1.0,
	sequence_context_boost: 1.2,
	memory_recall_intensity: 0.3,
	memory_score_boost: 1.5,
	cot_max_results: 3,
	cot_stimulate_base: 0.2,
	cot_stimulate_factor: 0.5,
	cot_stimulate_depth_factor: 0.3,
	max_implicit_results: 5
} as const

export const stimulation = {
	stimulation_max: 0.5,
	stimulation_min: 0.05,
	stimulation_confidence_min: 0.3,
	stimulation_confidence_target: 0.6,
	stimulation_score_weight: 0.7,
	stimulation_memory_weight: 0.3,
	conflict_stimulation_count_limit: 3,
	conflict_stimulation_score_limit: 0.6
} as const

export const confidence = {
	source_confidence_min: 0.3,
	source_confidence_base: 0.4,
	source_confidence_vector_bonus: 0.25,
	source_confidence_fulltext_bonus: 0.2,
	source_confidence_recall_bonus: 0.15,
	source_confidence_rerank_bonus: 0.2,
	source_confidence_max: 1.0,
	source_confidence_history_weight: 0.7
} as const

export const conflict = {
	conflict_penalty_threshold: 0.5,
	conflict_penalty_step: 0.15
} as const

export const replay = {
	replay_recency_days: 3,
	replay_priority_limit: 8,
	replay_learning_rate_min: 1.5
} as const

export const tick = {
	tick_potential_max: 2.0,
	tick_decay_rate: 0.9,
	min_potential: 0,
	input_decay_threshold: 100,
	global_decay_rate: 0.8,
	global_inhibition_max: 0.6,
	decay_strength: 0.8,
	reorganization_strength: 0.15,
	query_reward: 0.01,
	distance_epsilon: 0.001
} as const

export const node_edge = {
	potential_threshold: 0.5,
	node_potential_min: 0.05,
	edge_weight_max: 5.0,
	edge_weight_min: 0.1,
	edge_learning_factor: 0.2,
	edge_decay_factor: 0.001,
	strengthen_edge_weight: 0.1,
	weak_edge_threshold: 0.005
} as const

export const activation = {
	arousal_optimal_similarity: 0.6,
	arousal_width: 0.25,
	arousal_min: 0.4,
	arousal_max: 1.4,
	local_competition_edge_weight_min: 0.3,
	local_competition_ratio: 0.6,
	fatigue_threshold: 1000
} as const

export const shy = {
	hot_node_threshold: 0.8,
	max_active_limit: 100,
	node_decay_rate: 0.5,
	node_inactive_days: 1,
	edge_decay_rate: 0.1,
	edge_inactive_days: 7,
	competitive_decay_ratio: 0.4,
	competitive_inactive_days: 3,
	weight_death_threshold: 0.001,
	threshold_decay_rate: 0.8,
	threshold_spike: 2.0,
	max_threshold: 5.0,
	min_threshold: 0.5,
	max_threshold_decay_step: 0.5
} as const
