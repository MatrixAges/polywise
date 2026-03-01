export const shadow_interval_ms = 60 * 1000
export const idle_timeout_ms = 5 * 60 * 1000
export const idle_decay_threshold_ms = 3 * 60 * 1000
export const refractory_period_ms = 500

export const default_recall_depth = 2
export const default_search_limit = 30
export const default_rerank_limit = 30
export const default_stimulate_intensity = 0.3
export const default_node_threshold = 0.5
export const default_hebbian_reward = 0.5
export const default_edge_weight = 0.1
export const default_similarity_threshold = 0.1

export const snapshot_weight_threshold = 0.2
export const snapshot_edges_limit = 500
export const snapshot_nodes_limit = 60

export const context_keywords_limit = 8
export const context_similarity_threshold = 0.75
export const context_query_threshold = 0.65
export const context_query_limit = 1
export const context_sequence_depth = 3
export const context_sequence_branch = 3
export const context_sequence_hop_decay = 0.6
export const context_sequence_time_half_life_hours = 24
export const context_sequence_window_hours = 6
export const context_sequence_window_penalty = 0.8
export const context_sequence_replay_limit = 1
export const context_sequence_replay_min_score = 1.0
export const context_sequence_replay_strength = 0.12
export const query_keywords_limit = 8
export const search_limit_factor = 2

export const recency_half_life_days = 7
export const recency_min_weight = 0.4
export const recency_max_weight = 1.0
export const sequence_context_boost = 1.2
export const memory_recall_intensity = 0.3
export const memory_score_boost = 1.5
export const cot_max_results = 3
export const cot_stimulate_base = 0.2
export const cot_stimulate_factor = 0.5
export const cot_stimulate_depth_factor = 0.3
export const max_implicit_results = 5

export const stimulation_max = 0.5
export const stimulation_min = 0.05
export const stimulation_confidence_min = 0.3
export const stimulation_confidence_target = 0.6
export const stimulation_score_weight = 0.7
export const stimulation_memory_weight = 0.3
export const conflict_stimulation_count_limit = 3
export const conflict_stimulation_score_limit = 0.6
export const burst_tick_count = 100
export const burst_tick_delay_ms = 50

export const source_confidence_min = 0.3
export const source_confidence_base = 0.4
export const source_confidence_vector_bonus = 0.25
export const source_confidence_fulltext_bonus = 0.2
export const source_confidence_recall_bonus = 0.15
export const source_confidence_rerank_bonus = 0.2
export const source_confidence_max = 1.0
export const source_confidence_history_weight = 0.7

export const conflict_penalty_threshold = 0.5
export const conflict_penalty_step = 0.15

export const replay_recency_days = 3
export const replay_priority_limit = 8
export const replay_learning_rate_min = 1.5

export const tick_potential_max = 2.0
export const tick_decay_rate = 0.9
export const min_potential = 0
export const input_decay_threshold = 100
export const global_decay_rate = 0.8
export const global_inhibition_max = 0.6
export const decay_strength = 0.8
export const reorganization_strength = 0.15
export const query_reward = 0.01
export const distance_epsilon = 0.001

export const potential_threshold = 0.5
export const node_potential_min = 0.05
export const edge_weight_max = 5.0
export const edge_weight_min = 0.1
export const edge_learning_factor = 0.2
export const edge_decay_factor = 0.001
export const strengthen_edge_weight = 0.1
export const weak_edge_threshold = 0.005

export const arousal_optimal_similarity = 0.6
export const arousal_width = 0.25
export const arousal_min = 0.4
export const arousal_max = 1.4
export const local_competition_edge_weight_min = 0.3
export const local_competition_ratio = 0.6
export const fatigue_threshold = 1000

export const hot_node_threshold = 0.8
export const max_active_limit = 100
export const node_decay_rate = 0.5
export const node_inactive_days = 1
export const edge_decay_rate = 0.1
export const edge_inactive_days = 7
export const competitive_decay_ratio = 0.4
export const competitive_inactive_days = 3
export const weight_death_threshold = 0.001
export const threshold_decay_rate = 0.8
export const threshold_spike = 2.0
export const max_threshold = 5.0
export const min_threshold = 0.5
export const max_threshold_decay_step = 0.5
