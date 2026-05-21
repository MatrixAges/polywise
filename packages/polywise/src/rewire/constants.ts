import { config } from '@core/config'

import type { AppRewireConfig } from '@core/types'
import type { RewireConfig } from './types'

export const default_rewire_config: RewireConfig = {
	enabled: true,
	tick_ms: 120000,
	monitor_ms: 60000,
	idle_grace_ms: 30 * 60 * 1000,
	replay_window_ms: 24 * 60 * 60 * 1000,
	max_groups_per_cycle: 20,
	max_edge_creations_per_cycle: 40,
	max_edge_prunes_per_cycle: 40,
	hot_node_degree_limit: 14,
	cold_node_degree_limit: 2
}

export const rewire_event_fetch_limit_floor = 200
export const rewire_silent_relation = 'rewire_association'
export const rewire_query_relation = 'accepted_for_query'
export const rewire_silent_initial_weight = 0.12
export const rewire_silent_initial_confidence = 0.16
export const rewire_silent_initial_bandwidth = 0.12
export const rewire_silent_initial_stability = 0.08
export const rewire_silent_initial_score = 0.22
export const rewire_strengthen_weight_step = 0.08
export const rewire_strengthen_confidence_step = 0.04
export const rewire_strengthen_bandwidth_step = 0.03
export const rewire_strengthen_stability_step = 0.05
export const rewire_strengthen_score_step = 0.18
export const rewire_promote_score_threshold = 1.2
export const rewire_promote_confidence_threshold = 0.42
export const rewire_promote_stability_threshold = 0.55
export const rewire_hot_active_level_threshold = 0.85
export const rewire_silent_ttl_ms = 7 * 24 * 60 * 60 * 1000
export const rewire_active_ttl_ms = 30 * 24 * 60 * 60 * 1000
export const rewire_decay_scan_limit = 200
export const rewire_decay_weight_factor = 0.985
export const rewire_decay_confidence_step = 0.01
export const rewire_decay_bandwidth_step = 0.01
export const rewire_decay_stability_step = 0.02
export const rewire_decay_score_step = 0.03
export const rewire_weight_floor = 0.02
export const rewire_bandwidth_floor = 0.05

const toPositiveInt = (value: unknown, fallback: number) => {
	const num = Math.round(Number(value))

	return Number.isFinite(num) && num > 0 ? num : fallback
}

const toBoolean = (value: unknown, fallback: boolean) => {
	if (typeof value === 'boolean') return value

	return fallback
}

export const getRewireConfig = (override?: Partial<AppRewireConfig> | null): RewireConfig => {
	const source = override ?? config.rewire ?? {}

	return {
		enabled: toBoolean(source.enabled, default_rewire_config.enabled),
		tick_ms: toPositiveInt(source.tick_ms, default_rewire_config.tick_ms),
		monitor_ms: toPositiveInt(source.monitor_ms, default_rewire_config.monitor_ms),
		idle_grace_ms: toPositiveInt(source.idle_grace_ms, default_rewire_config.idle_grace_ms),
		replay_window_ms: toPositiveInt(source.replay_window_ms, default_rewire_config.replay_window_ms),
		max_groups_per_cycle: toPositiveInt(
			source.max_groups_per_cycle,
			default_rewire_config.max_groups_per_cycle
		),
		max_edge_creations_per_cycle: toPositiveInt(
			source.max_edge_creations_per_cycle,
			default_rewire_config.max_edge_creations_per_cycle
		),
		max_edge_prunes_per_cycle: toPositiveInt(
			source.max_edge_prunes_per_cycle,
			default_rewire_config.max_edge_prunes_per_cycle
		),
		hot_node_degree_limit: toPositiveInt(
			source.hot_node_degree_limit,
			default_rewire_config.hot_node_degree_limit
		),
		cold_node_degree_limit: toPositiveInt(
			source.cold_node_degree_limit,
			default_rewire_config.cold_node_degree_limit
		)
	}
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const scoreEdgeStrength = (args: {
	weight?: number | null
	confidence?: number | null
	bandwidth?: number | null
}) => {
	const weight = Number(args.weight ?? 0)
	const confidence = Number(args.confidence ?? 0)
	const bandwidth = Number(args.bandwidth ?? 0)

	return clamp(weight * confidence * bandwidth, 0, 2)
}

export const shouldPromoteSilentEdge = (args: {
	rewire_score?: number | null
	confidence?: number | null
	stability?: number | null
}) =>
	Number(args.rewire_score ?? 0) >= rewire_promote_score_threshold &&
	(Number(args.confidence ?? 0) >= rewire_promote_confidence_threshold ||
		Number(args.stability ?? 0) >= rewire_promote_stability_threshold)

export const buildCandidatePairs = (node_ids: Array<string>, limit: number) => {
	const normalized = Array.from(new Set(node_ids.filter(Boolean))).sort()
	const pairs = [] as Array<[string, string]>

	for (let i = 0; i < normalized.length; i += 1) {
		for (let j = i + 1; j < normalized.length; j += 1) {
			pairs.push([normalized[i], normalized[j]])

			if (pairs.length >= limit) {
				return pairs
			}
		}
	}

	return pairs
}
