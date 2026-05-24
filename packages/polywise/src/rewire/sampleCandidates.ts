import { env } from '@core/env'
import { getId } from 'stk/utils'

import {
	buildCandidatePairs,
	clamp,
	rewire_silent_initial_bandwidth,
	rewire_silent_initial_confidence,
	rewire_silent_initial_score,
	rewire_silent_initial_stability,
	rewire_silent_initial_weight,
	rewire_silent_relation
} from './constants'

import type { ReplayGroup } from './types'

interface SampleCandidatesArgs {
	agent_id: string | null
	group: ReplayGroup
	now: number
	budget: number
}

export default ({ agent_id, group, now, budget }: SampleCandidatesArgs) => {
	if (budget <= 0) {
		return { created: 0, touched_pairs: [] as Array<[string, string]> }
	}

	const pairs = buildCandidatePairs(group.accepted_node_ids, budget)

	if (pairs.length === 0) {
		return { created: 0, touched_pairs: [] as Array<[string, string]> }
	}

	const getEdge =
		agent_id === null
			? env.sqlite.prepare(`
				SELECT id, state, weight, confidence, bandwidth, stability, rewire_score
				FROM edge
				WHERE agent_id is null
					AND ((source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?))
				LIMIT 1
			`)
			: env.sqlite.prepare(`
				SELECT id, state, weight, confidence, bandwidth, stability, rewire_score
				FROM edge
				WHERE agent_id = ?
					AND ((source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?))
				LIMIT 1
			`)
	const updateEdge = env.sqlite.prepare(`
		UPDATE edge
		SET confidence = ?,
			stability = ?,
			rewire_score = ?,
			active_at = ?,
			last_rewire_at = ?
		WHERE id = ?
	`)
	const insertEdge = env.sqlite.prepare(`
		INSERT INTO edge (
			id, relation, agent_id, source_id, target_id, weight, growth, confidence, distance,
			bandwidth, active_times, active_at, is_frozen, state, stability, rewire_score,
			last_rewire_at, created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, 0.8, ?, 1.0, ?, 1, ?, 0, 'silent', ?, ?, ?, ?)
	`)

	let created = 0
	const touched_pairs = [] as Array<[string, string]>

	for (const [source_id, target_id] of pairs) {
		const existing =
			agent_id === null
				? (getEdge.get(source_id, target_id, target_id, source_id) as
						| {
								id: string
								state: string
								weight: number | null
								confidence: number | null
								bandwidth: number | null
								stability: number | null
								rewire_score: number | null
						  }
						| undefined)
				: (getEdge.get(agent_id, source_id, target_id, target_id, source_id) as
						| {
								id: string
								state: string
								weight: number | null
								confidence: number | null
								bandwidth: number | null
								stability: number | null
								rewire_score: number | null
						  }
						| undefined)

		if (existing) {
			if (existing.state === 'silent') {
				updateEdge.run(
					clamp(Number(existing.confidence ?? 0) + 0.03, 0, 1),
					clamp(Number(existing.stability ?? 0) + 0.04, 0, 1),
					Math.max(0, Number(existing.rewire_score ?? 0) + group.total_strength * 0.12),
					now,
					now,
					existing.id
				)
				touched_pairs.push([source_id, target_id])
			}

			continue
		}

		insertEdge.run(
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
			rewire_silent_initial_score + group.total_strength * 0.08,
			now,
			now
		)
		created += 1
		touched_pairs.push([source_id, target_id])
	}

	return { created, touched_pairs }
}
