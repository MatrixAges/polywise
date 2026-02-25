import { describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { sql_sleep_tick_decay_edges, sql_sleep_tick_replay } from '../src/sql/Brain'
import { getTestKeywords, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Sleep replay and competitive decay', () => {
	const createPoly = async () => {
		const poly = new Polywise()
		const db_name = getDataDir()

		await poly.init({
			data_dir: db_name,
			embedding_config: { type: 'custom', fn: getTestVectors },
			keyword_config: { type: 'custom', fn: getTestKeywords }
		})

		return poly
	}

	const getEdgeWeight = async (poly: Polywise, source_id: string, target_id: string) => {
		const res = await poly.db.query<{ weight: number }>(
			'SELECT weight FROM brain.edges WHERE source_id = $1 AND target_id = $2',
			[source_id, target_id]
		)

		return res.rows[0]?.weight ?? 0
	}

	const updateEdge = async (
		poly: Polywise,
		args: { source_id: string; target_id: string; learning_rate: number; updated_at: string }
	) => {
		const { source_id, target_id, learning_rate, updated_at } = args

		await poly.db.query(
			'UPDATE brain.edges SET learning_rate = $1, updated_at = $2 WHERE source_id = $3 AND target_id = $4',
			[learning_rate, updated_at, source_id, target_id]
		)
	}

	it('should skip replay for stale edges', async () => {
		const poly = await createPoly()

		try {
			const alpha_id = await poly.addNode({ label: 'alpha_replay', x: 0, y: 0 })
			const beta_id = await poly.addNode({ label: 'beta_replay', x: 10, y: 0 })
			const gamma_id = await poly.addNode({ label: 'gamma_replay', x: 20, y: 0 })

			await poly.connect({ source_id: alpha_id, target_id: beta_id, weight: 1.0 })
			await poly.connect({ source_id: beta_id, target_id: gamma_id, weight: 1.0 })

			const recent_at = new Date().toISOString()
			const stale_at = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

			await updateEdge(poly, {
				source_id: alpha_id,
				target_id: beta_id,
				learning_rate: 2.0,
				updated_at: recent_at
			})
			await updateEdge(poly, {
				source_id: beta_id,
				target_id: gamma_id,
				learning_rate: 2.0,
				updated_at: stale_at
			})

			const recent_before = await getEdgeWeight(poly, alpha_id, beta_id)
			const stale_before = await getEdgeWeight(poly, beta_id, gamma_id)

			await poly.db.exec(sql_sleep_tick_replay)

			const recent_after = await getEdgeWeight(poly, alpha_id, beta_id)
			const stale_after = await getEdgeWeight(poly, beta_id, gamma_id)

			expect(recent_after).toBeGreaterThan(recent_before)
			expect(stale_after).toBe(stale_before)
		} finally {
			await poly.off()
		}
	})

	it('should decay weak edges under local competition', async () => {
		const poly = await createPoly()

		try {
			const alpha_id = await poly.addNode({ label: 'alpha_decay', x: 0, y: 0 })
			const beta_id = await poly.addNode({ label: 'beta_decay', x: 10, y: 0 })
			const gamma_id = await poly.addNode({ label: 'gamma_decay', x: 20, y: 0 })

			await poly.connect({ source_id: alpha_id, target_id: beta_id, weight: 2.0 })
			await poly.connect({ source_id: alpha_id, target_id: gamma_id, weight: 0.7 })

			const stale_at = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

			await updateEdge(poly, {
				source_id: alpha_id,
				target_id: beta_id,
				learning_rate: 1.0,
				updated_at: stale_at
			})
			await updateEdge(poly, {
				source_id: alpha_id,
				target_id: gamma_id,
				learning_rate: 1.0,
				updated_at: stale_at
			})

			const weak_before = await getEdgeWeight(poly, alpha_id, gamma_id)

			await poly.db.exec(sql_sleep_tick_decay_edges)

			const weak_after = await getEdgeWeight(poly, alpha_id, gamma_id)

			expect(weak_after).toBeLessThan(weak_before)
		} finally {
			await poly.off()
		}
	})
})
