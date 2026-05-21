import { env } from '@core/env'
import { getId } from 'stk/utils'

import applyHomeostasis from './applyHomeostasis'
import collectReplayGroups from './collectReplayGroups'
import {
	clamp,
	getRewireConfig,
	rewire_query_relation,
	rewire_silent_initial_bandwidth,
	rewire_silent_initial_confidence,
	rewire_silent_initial_score,
	rewire_silent_initial_stability,
	rewire_silent_initial_weight,
	rewire_strengthen_bandwidth_step,
	rewire_strengthen_confidence_step,
	rewire_strengthen_score_step,
	rewire_strengthen_stability_step,
	rewire_strengthen_weight_step
} from './constants'
import decay from './decay'
import sampleCandidates from './sampleCandidates'
import stabilizeEdges from './stabilizeEdges'

import type { ReplayGroup, RewireCycleSummary } from './types'

const buildInitialSummary = (cycle_at: number): RewireCycleSummary => ({
	cycle_at,
	skipped: false,
	groups_processed: 0,
	events_deleted: 0,
	edges_created: 0,
	edges_strengthened: 0,
	edges_promoted: 0,
	edges_pruned: 0,
	edges_downgraded: 0,
	edges_decayed: 0,
	touched_nodes: 0
})

const strengthenCenterEdges = (groups: Array<ReplayGroup>, now: number, budget: number) => {
	const getEdge = env.sqlite.prepare(`
		SELECT id, state, weight, confidence, bandwidth, stability, rewire_score
		FROM edge
		WHERE source_id = ? AND target_id = ?
		LIMIT 1
	`)
	const insertEdge = env.sqlite.prepare(`
		INSERT INTO edge (
			id, relation, agent_id, source_id, target_id, weight, growth, confidence, distance,
			bandwidth, active_times, active_at, is_frozen, state, stability, rewire_score,
			last_rewire_at, created_at
		)
		VALUES (?, ?, null, ?, ?, ?, 1.0, ?, 1.0, ?, 1, ?, 0, 'silent', ?, ?, ?, ?)
	`)
	const updateEdge = env.sqlite.prepare(`
		UPDATE edge
		SET weight = ?,
			confidence = ?,
			bandwidth = ?,
			stability = ?,
			rewire_score = ?,
			active_times = coalesce(active_times, 0) + 1,
			active_at = ?,
			last_rewire_at = ?
		WHERE id = ?
	`)

	let remaining_budget = budget
	let created = 0
	let strengthened = 0

	for (const group of groups) {
		for (const center_id of group.center_node_ids) {
			for (const accepted_id of group.accepted_node_ids) {
				if (!center_id || !accepted_id || center_id === accepted_id) {
					continue
				}

				const existing = getEdge.get(center_id, accepted_id) as
					| {
							id: string
							state: string
							weight: number | null
							confidence: number | null
							bandwidth: number | null
							stability: number | null
							rewire_score: number | null
					  }
					| undefined

				if (!existing) {
					if (remaining_budget <= 0) {
						continue
					}

					insertEdge.run(
						getId(),
						rewire_query_relation,
						center_id,
						accepted_id,
						rewire_silent_initial_weight,
						rewire_silent_initial_confidence + 0.08,
						rewire_silent_initial_bandwidth,
						now,
						rewire_silent_initial_stability + 0.04,
						rewire_silent_initial_score + group.total_strength * 0.2,
						now,
						now
					)
					created += 1
					remaining_budget -= 1
					strengthened += 1
					continue
				}

				updateEdge.run(
					Number(existing.weight ?? 0) + rewire_strengthen_weight_step,
					clamp(Number(existing.confidence ?? 0) + rewire_strengthen_confidence_step, 0, 1),
					Math.max(0.05, Number(existing.bandwidth ?? 0) + rewire_strengthen_bandwidth_step),
					clamp(Number(existing.stability ?? 0) + rewire_strengthen_stability_step, 0, 1),
					Math.max(
						0,
						Number(existing.rewire_score ?? 0) +
							group.total_strength * rewire_strengthen_score_step
					),
					now,
					now,
					existing.id
				)
				strengthened += 1
			}
		}
	}

	return { strengthened, created }
}

const deleteProcessedEvents = (event_ids: Array<string>) => {
	const ids = Array.from(new Set(event_ids.filter(Boolean)))

	if (ids.length === 0) {
		return 0
	}

	const placeholders = Array(ids.length).fill('?').join(',')
	const stmt = env.sqlite.prepare(`DELETE FROM rewire_event WHERE id IN (${placeholders})`)
	const result = stmt.run(...ids)

	return Number(result.changes ?? 0)
}

export default async () => {
	const cycle_at = Date.now()
	const current_config = getRewireConfig()
	const summary = buildInitialSummary(cycle_at)
	const groups = await collectReplayGroups()

	if (groups.length === 0) {
		return {
			...summary,
			skipped: true,
			reason: 'no_events'
		}
	}

	const now = Date.now()
	const touched_nodes = new Set<string>()
	const peer_map = new Map<string, Set<string>>()
	const processed_event_ids = [] as Array<string>
	let creation_budget = current_config.max_edge_creations_per_cycle
	let prune_budget = current_config.max_edge_prunes_per_cycle

	const transaction = env.sqlite.transaction(() => {
		const strengthen_result = strengthenCenterEdges(groups, now, creation_budget)
		summary.edges_strengthened = strengthen_result.strengthened
		summary.edges_created += strengthen_result.created
		creation_budget = Math.max(0, creation_budget - strengthen_result.created)

		for (const group of groups) {
			summary.groups_processed += 1
			processed_event_ids.push(...group.event_ids)

			for (const node_id of [
				...group.center_node_ids,
				...group.accepted_node_ids,
				...group.rejected_node_ids
			]) {
				if (node_id) {
					touched_nodes.add(node_id)
				}
			}

			for (const source_id of group.accepted_node_ids) {
				if (!peer_map.has(source_id)) {
					peer_map.set(source_id, new Set())
				}

				for (const target_id of group.accepted_node_ids) {
					if (target_id && target_id !== source_id) {
						peer_map.get(source_id)?.add(target_id)
					}
				}
			}

			const candidate_result = sampleCandidates({
				group,
				now,
				budget: creation_budget
			})

			summary.edges_created += candidate_result.created
			creation_budget = Math.max(0, creation_budget - candidate_result.created)
		}

		const stabilize_result = stabilizeEdges({
			touched_node_ids: [...touched_nodes],
			now
		})
		summary.edges_promoted += stabilize_result.promoted

		const homeostasis_result = applyHomeostasis({
			touched_node_ids: [...touched_nodes],
			peer_map,
			now,
			budget: prune_budget
		})
		summary.edges_pruned += homeostasis_result.pruned
		summary.edges_downgraded += homeostasis_result.downgraded
		summary.edges_created += homeostasis_result.created
		prune_budget = Math.max(0, prune_budget - homeostasis_result.pruned - homeostasis_result.downgraded)

		const decay_result = decay({
			now,
			budget: prune_budget
		})
		summary.edges_decayed += decay_result.decayed
		summary.edges_pruned += decay_result.pruned
		summary.edges_downgraded += decay_result.downgraded
		summary.events_deleted = deleteProcessedEvents(processed_event_ids)
	})

	transaction()

	summary.touched_nodes = touched_nodes.size

	return summary
}
