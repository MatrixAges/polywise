import { env } from '@core/env'

import {
	clamp,
	rewire_promote_confidence_threshold,
	rewire_promote_score_threshold,
	rewire_promote_stability_threshold,
	shouldPromoteSilentEdge
} from './constants'

interface StabilizeEdgesArgs {
	touched_node_ids: Array<string>
	now: number
}

export default ({ touched_node_ids, now }: StabilizeEdgesArgs) => {
	const ids = Array.from(new Set(touched_node_ids.filter(Boolean)))

	if (ids.length === 0) {
		return { promoted: 0 }
	}

	const placeholders = Array(ids.length).fill('?').join(',')
	const rows = env.sqlite
		.prepare(
			`
			SELECT id, weight, confidence, bandwidth, stability, rewire_score
			FROM edge
			WHERE state = 'silent' AND (source_id IN (${placeholders}) OR target_id IN (${placeholders}))
		`
		)
		.all(...ids, ...ids) as Array<{
		id: string
		weight: number | null
		confidence: number | null
		bandwidth: number | null
		stability: number | null
		rewire_score: number | null
	}>

	if (rows.length === 0) {
		return { promoted: 0 }
	}

	const promote = env.sqlite.prepare(`
		UPDATE edge
		SET state = 'active',
			weight = ?,
			confidence = ?,
			bandwidth = ?,
			stability = ?,
			last_rewire_at = ?,
			active_at = ?
		WHERE id = ?
	`)

	let promoted = 0

	for (const row of rows) {
		if (!shouldPromoteSilentEdge(row)) {
			continue
		}

		promote.run(
			Math.max(Number(row.weight ?? 0), 0.55),
			Math.max(Number(row.confidence ?? 0), rewire_promote_confidence_threshold),
			Math.max(Number(row.bandwidth ?? 0), 0.45),
			Math.max(Number(row.stability ?? 0), rewire_promote_stability_threshold),
			now,
			now,
			row.id
		)
		promoted += 1
	}

	return { promoted }
}
