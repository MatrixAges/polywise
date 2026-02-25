import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { MAX_ACTIVE_LIMIT, MAX_THRESHOLD_DECAY_STEP, SCHEMA_BRAIN } from '../src/consts'
import Polywise from '../src/Polywise'
import { getTestKeywords, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe('Global Homeostatic Plasticity', () => {
	let poly: Polywise
	const db_name = getDataDir()

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir: db_name,
			embedding_config: { type: 'custom', fn: getTestVectors },
			keyword_config: { type: 'custom', fn: getTestKeywords }
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should maintain high thresholds when system is overloaded (High Heat)', async () => {
		// 1. Artificially create "Overload" state: Insert MAX_ACTIVE_LIMIT + 50 active nodes
		const overload_count = MAX_ACTIVE_LIMIT + 50
		const values = Array.from(
			{ length: overload_count },
			(_, i) => `('overload_${i}', 'Overload ${i}', 0, 0, 0.5, 0.5, TRUE)`
		).join(',')

		await poly.queryRaw(`
			INSERT INTO ${SCHEMA_BRAIN}.nodes (id, label, x, y, threshold, current_threshold, is_active)
			VALUES ${values}
		`)

		// 2. Create a "Probe Node" with high threshold (representing a protected state)
		const probe_id = 'probe_node'
		await poly.queryRaw(`
			INSERT INTO ${SCHEMA_BRAIN}.nodes (id, label, x, y, threshold, current_threshold, is_active)
			VALUES ('${probe_id}', 'Probe', 0, 0, 0.5, 5.0, FALSE)
		`)

		// 3. Verify Active Count
		const active_count = await poly.getActiveNodeCount()
		expect(active_count).toBeGreaterThan(MAX_ACTIVE_LIMIT)

		// 4. Run Tick
		await poly.tick()

		// 5. Check Probe Node Threshold
		// Heat ~ 1.0 => Decrement ~ 0.0 => Threshold should stay ~5.0
		const probe_node = (await poly.queryRaw(`SELECT * FROM ${SCHEMA_BRAIN}.nodes WHERE id = '${probe_id}'`))[0]
		expect(probe_node.current_threshold).toBeCloseTo(5.0, 1) // Allow small floating point variance
	})

	it('should rapidly decay thresholds when system is cool (Low Heat)', async () => {
		// 1. Clear the overload nodes to cool down the system
		await poly.queryRaw(`DELETE FROM ${SCHEMA_BRAIN}.nodes WHERE id LIKE 'overload_%'`)

		// 2. Verify Active Count is low (only Probe might be left, or 0)
		const active_count = await poly.getActiveNodeCount()
		expect(active_count).toBeLessThan(MAX_ACTIVE_LIMIT)

		// 3. Reset Probe Node to high threshold for testing decay
		const probe_id = 'probe_node'
		await poly.queryRaw(`
			UPDATE ${SCHEMA_BRAIN}.nodes 
			SET current_threshold = 5.0, is_active = FALSE 
			WHERE id = '${probe_id}'
		`)

		// 4. Run Tick
		await poly.tick()

		// 5. Check Probe Node Threshold
		// Heat ~ 0.0 => Decrement ~ MAX_THRESHOLD_DECAY_STEP (0.5) => Threshold should drop to ~4.5
		const probe_node = (await poly.queryRaw(`SELECT * FROM ${SCHEMA_BRAIN}.nodes WHERE id = '${probe_id}'`))[0]
		// 5.0 - 0.5 = 4.5
		expect(probe_node.current_threshold).toBeLessThan(4.9)
		expect(probe_node.current_threshold).toBeCloseTo(5.0 - MAX_THRESHOLD_DECAY_STEP, 1)
	})
})
