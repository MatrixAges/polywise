import { env } from '@core/env'
import { getId } from 'stk/utils'

import {
	clamp,
	getRewireConfig,
	rewire_hot_active_level_threshold,
	rewire_silent_initial_bandwidth,
	rewire_silent_initial_confidence,
	rewire_silent_initial_score,
	rewire_silent_initial_stability,
	rewire_silent_initial_weight,
	rewire_silent_relation,
	rewire_silent_ttl_ms,
	scoreEdgeStrength
} from './constants'

interface ApplyHomeostasisArgs {
	agent_id: string | null
	touched_node_ids: Array<string>
	peer_map: Map<string, Set<string>>
	now: number
	budget: number
}

export default ({ agent_id, touched_node_ids, peer_map, now, budget }: ApplyHomeostasisArgs) => {
	if (budget <= 0) {
		return { pruned: 0, downgraded: 0, created: 0 }
	}

	const current_config = getRewireConfig()
	const node_ids = Array.from(new Set(touched_node_ids.filter(Boolean)))

	if (node_ids.length === 0) {
		return { pruned: 0, downgraded: 0, created: 0 }
	}

	const getNode =
		agent_id === null
			? env.sqlite.prepare(`
				SELECT id, active_level, is_frozen
				FROM node
				WHERE id = ? AND agent_id is null
				LIMIT 1
			`)
			: env.sqlite.prepare(`
				SELECT id, active_level, is_frozen
				FROM node
				WHERE id = ? AND agent_id = ?
				LIMIT 1
			`)
	const getEdges =
		agent_id === null
			? env.sqlite.prepare(`
				SELECT id, source_id, target_id, state, weight, confidence, bandwidth, stability, rewire_score, active_at, last_rewire_at, is_frozen
				FROM edge
				WHERE agent_id is null AND (source_id = ? OR target_id = ?)
			`)
			: env.sqlite.prepare(`
				SELECT id, source_id, target_id, state, weight, confidence, bandwidth, stability, rewire_score, active_at, last_rewire_at, is_frozen
				FROM edge
				WHERE agent_id = ? AND (source_id = ? OR target_id = ?)
			`)
	const deleteEdge = env.sqlite.prepare(`DELETE FROM edge WHERE id = ?`)
	const downgradeEdge = env.sqlite.prepare(`
		UPDATE edge
		SET state = 'silent',
			stability = ?,
			rewire_score = ?,
			last_rewire_at = ?
		WHERE id = ?
	`)
	const getEdgeAnyDirection =
		agent_id === null
			? env.sqlite.prepare(`
				SELECT id
				FROM edge
				WHERE agent_id is null
					AND ((source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?))
				LIMIT 1
			`)
			: env.sqlite.prepare(`
				SELECT id
				FROM edge
				WHERE agent_id = ?
					AND ((source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?))
				LIMIT 1
			`)
	const insertSilent = env.sqlite.prepare(`
		INSERT INTO edge (
			id, relation, agent_id, source_id, target_id, weight, growth, confidence, distance,
			bandwidth, active_times, active_at, is_frozen, state, stability, rewire_score,
			last_rewire_at, created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, 0.7, ?, 1.0, ?, 1, ?, 0, 'silent', ?, ?, ?, ?)
	`)

	let remaining_budget = budget
	let pruned = 0
	let downgraded = 0
	let created = 0

	for (const node_id of node_ids) {
		if (remaining_budget <= 0) {
			break
		}

		const current_node =
			agent_id === null
				? (getNode.get(node_id) as
						| { id: string; active_level: number | null; is_frozen: number | null }
						| undefined)
				: (getNode.get(node_id, agent_id) as
						| { id: string; active_level: number | null; is_frozen: number | null }
						| undefined)

		if (!current_node || current_node.is_frozen) {
			continue
		}

		const edges =
			agent_id === null
				? (getEdges.all(node_id, node_id) as Array<{
						id: string
						source_id: string
						target_id: string
						state: string
						weight: number | null
						confidence: number | null
						bandwidth: number | null
						stability: number | null
						rewire_score: number | null
						active_at: number | null
						last_rewire_at: number | null
						is_frozen: number | null
					}>)
				: (getEdges.all(agent_id, node_id, node_id) as Array<{
						id: string
						source_id: string
						target_id: string
						state: string
						weight: number | null
						confidence: number | null
						bandwidth: number | null
						stability: number | null
						rewire_score: number | null
						active_at: number | null
						last_rewire_at: number | null
						is_frozen: number | null
					}>)
		const degree = edges.length
		const is_hot =
			degree > current_config.hot_node_degree_limit ||
			Number(current_node.active_level ?? 0) >= rewire_hot_active_level_threshold

		if (is_hot) {
			let local_changes = 0
			const ordered = [...edges]
				.filter(edge => !edge.is_frozen)
				.sort((a, b) => {
					if (a.state !== b.state) {
						return a.state === 'silent' ? -1 : 1
					}

					const strength_delta = scoreEdgeStrength(a) - scoreEdgeStrength(b)

					if (strength_delta !== 0) {
						return strength_delta
					}

					return (
						Number(a.last_rewire_at ?? a.active_at ?? 0) -
						Number(b.last_rewire_at ?? b.active_at ?? 0)
					)
				})
			const target_prunes = Math.min(
				Math.max(degree - current_config.hot_node_degree_limit, 1),
				remaining_budget
			)

			for (const current_edge of ordered) {
				if (local_changes >= target_prunes || remaining_budget <= 0) {
					break
				}

				const edge_age = now - Number(current_edge.last_rewire_at ?? current_edge.active_at ?? 0)
				const weak =
					scoreEdgeStrength(current_edge) <= 0.08 || Number(current_edge.confidence ?? 0) <= 0.16
				const stale = edge_age >= rewire_silent_ttl_ms

				if (current_edge.state === 'silent' && (weak || stale)) {
					deleteEdge.run(current_edge.id)
					pruned += 1
					local_changes += 1
					remaining_budget -= 1
					continue
				}

				if (current_edge.state === 'active' && (weak || stale)) {
					downgradeEdge.run(
						clamp(Number(current_edge.stability ?? 0) - 0.18, 0, 1),
						Math.max(0, Number(current_edge.rewire_score ?? 0) - 0.1),
						now,
						current_edge.id
					)
					downgraded += 1
					local_changes += 1
					remaining_budget -= 1
				}
			}
		}

		if (remaining_budget <= 0 || degree >= current_config.cold_node_degree_limit) {
			continue
		}

		const peers = Array.from(peer_map.get(node_id) ?? []).filter(peer_id => peer_id !== node_id)

		for (const peer_id of peers) {
			if (remaining_budget <= 0) {
				break
			}

			const existing =
				agent_id === null
					? (getEdgeAnyDirection.get(node_id, peer_id, peer_id, node_id) as
							| { id: string }
							| undefined)
					: (getEdgeAnyDirection.get(agent_id, node_id, peer_id, peer_id, node_id) as
							| { id: string }
							| undefined)

			if (existing?.id) {
				continue
			}

			const [source_id, target_id] = [node_id, peer_id].sort()

			insertSilent.run(
				getId(),
				rewire_silent_relation,
				agent_id,
				source_id,
				target_id,
				rewire_silent_initial_weight,
				rewire_silent_initial_confidence,
				rewire_silent_initial_bandwidth,
				now,
				rewire_silent_initial_stability,
				rewire_silent_initial_score,
				now,
				now
			)
			created += 1
			remaining_budget -= 1
			break
		}
	}

	return { pruned, downgraded, created }
}
