import { env } from '@core/env'

import {
	clamp,
	rewire_active_ttl_ms,
	rewire_bandwidth_floor,
	rewire_decay_bandwidth_step,
	rewire_decay_confidence_step,
	rewire_decay_scan_limit,
	rewire_decay_score_step,
	rewire_decay_stability_step,
	rewire_decay_weight_factor,
	rewire_silent_ttl_ms,
	rewire_weight_floor,
	scoreEdgeStrength
} from './constants'

interface DecayArgs {
	now: number
	budget: number
}

export default ({ now, budget }: DecayArgs) => {
	if (budget <= 0) {
		return { decayed: 0, pruned: 0, downgraded: 0 }
	}

	const rows = env.sqlite
		.prepare(
			`
			SELECT id, state, weight, confidence, bandwidth, stability, rewire_score, active_at, last_rewire_at
			FROM edge
			WHERE is_frozen = 0
			ORDER BY coalesce(last_rewire_at, active_at, created_at) ASC
			LIMIT ?
		`
		)
		.all(rewire_decay_scan_limit) as Array<{
		id: string
		state: string
		weight: number | null
		confidence: number | null
		bandwidth: number | null
		stability: number | null
		rewire_score: number | null
		active_at: number | null
		last_rewire_at: number | null
	}>

	const deleteEdge = env.sqlite.prepare(`DELETE FROM edge WHERE id = ?`)
	const downgradeEdge = env.sqlite.prepare(`
		UPDATE edge
		SET state = 'silent',
			stability = ?,
			rewire_score = ?,
			last_rewire_at = ?
		WHERE id = ?
	`)
	const updateEdge = env.sqlite.prepare(`
		UPDATE edge
		SET weight = ?,
			confidence = ?,
			bandwidth = ?,
			stability = ?,
			rewire_score = ?,
			last_rewire_at = ?
		WHERE id = ?
	`)

	let decayed = 0
	let pruned = 0
	let downgraded = 0
	let remaining_budget = budget

	for (const row of rows) {
		if (remaining_budget <= 0) {
			break
		}

		const edge_age = now - Number(row.last_rewire_at ?? row.active_at ?? 0)
		const strength = scoreEdgeStrength(row)

		if (row.state === 'silent' && edge_age >= rewire_silent_ttl_ms && strength <= 0.05) {
			deleteEdge.run(row.id)
			pruned += 1
			remaining_budget -= 1
			continue
		}

		if (row.state === 'active' && edge_age >= rewire_active_ttl_ms && strength <= 0.08) {
			downgradeEdge.run(
				clamp(Number(row.stability ?? 0) - 0.15, 0, 1),
				Math.max(0, Number(row.rewire_score ?? 0) - 0.08),
				now,
				row.id
			)
			downgraded += 1
			remaining_budget -= 1
			continue
		}

		updateEdge.run(
			Math.max(rewire_weight_floor, Number(row.weight ?? 0) * rewire_decay_weight_factor),
			clamp(Number(row.confidence ?? 0) - rewire_decay_confidence_step, 0, 1),
			Math.max(rewire_bandwidth_floor, Number(row.bandwidth ?? 0) - rewire_decay_bandwidth_step),
			clamp(Number(row.stability ?? 0) - rewire_decay_stability_step, 0, 1),
			Math.max(0, Number(row.rewire_score ?? 0) - rewire_decay_score_step),
			now,
			row.id
		)
		decayed += 1
		remaining_budget -= 1
	}

	return { decayed, pruned, downgraded }
}
