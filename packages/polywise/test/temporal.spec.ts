import { existsSync, rmSync } from 'fs'
import { join } from 'path'

import { afterEach, beforeEach, describe, expect, it } from '@rstest/core'

import { getTestVectors } from '../scripts/getTestVectors'
import Polywise from '../src/Polywise'

describe('Polywise Temporal Mechanics', () => {
	let poly: Polywise
	const test_id = Math.random().toString(36).substring(7)
	const test_dir = `.test_db/:polywise_temporal_test_${test_id}:`

	beforeEach(async () => {
		if (existsSync(test_dir)) {
			rmSync(test_dir, { recursive: true, force: true })
		}
		poly = new Polywise()
		await poly.init({
			data_dir: test_dir,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			}
		})
	})

	afterEach(async () => {
		await poly.off()
		if (existsSync(test_dir)) {
			rmSync(test_dir, { recursive: true, force: true })
		}
	})

	it('should have created_at and updated_at for new nodes and edges', async () => {
		const node_id = await poly.addNode({ label: 'TemporalNode', x: 0, y: 0 })
		const target_id = await poly.addNode({ label: 'TargetNode', x: 100, y: 100 })
		await poly.connect({ source_id: node_id, target_id })

		const nodes = await poly.getAllNodes()
		const node = nodes.find(n => n.id === node_id)
		expect(node?.created_at).toBeDefined()
		expect(node?.updated_at).toBeDefined()

		const snapshot = await poly.getSnapshot(0)
		const edge = snapshot.edges.find(e => e.source_id === node_id && e.target_id === target_id)
		expect(edge?.created_at).toBeDefined()
		expect(edge?.updated_at).toBeDefined()
	})

	it('should update updated_at when node is upserted', async () => {
		const label = 'UpsertNode'
		await poly.addNode({ label, x: 0, y: 0 })

		const nodes_initial = await poly.getAllNodes()
		const node_initial = nodes_initial.find(n => n.label === label)
		const initialUpdatedAt = new Date(node_initial!.updated_at!).getTime()

		// Wait 1.1s to ensure timestamp difference
		await new Promise(resolve => setTimeout(resolve, 1100))

		// Trigger update via manual SQL using the upsert logic (simulating save's node processing)
		await (poly as any).queryRaw(
			`
			INSERT INTO brain.nodes (label, x, y, potential, updated_at)
			VALUES ($1, 0, 0, 1.0, CURRENT_TIMESTAMP)
			ON CONFLICT (label) DO UPDATE SET 
				potential = brain.nodes.potential + 0.5,
				updated_at = CURRENT_TIMESTAMP
		`,
			[label]
		)

		const nodes_final = await poly.getAllNodes()
		const node_final = nodes_final.find(n => n.label === label)
		const finalUpdatedAt = new Date(node_final!.updated_at!).getTime()

		expect(finalUpdatedAt).toBeGreaterThan(initialUpdatedAt)
	})

	it('should demonstrate recency bias in signal transmission', async () => {
		// Path A: Old connection (1 year ago)
		const start_a = await poly.addNode({ label: 'StartA', x: 0, y: 0, threshold: 0.1 })
		const end_a = await poly.addNode({ label: 'EndA', x: 0, y: 100, threshold: 0.1 })
		await poly.connect({ source_id: start_a, target_id: end_a, weight: 2.0 })
		await (poly as any).queryRaw(
			"UPDATE brain.edges SET updated_at = CURRENT_TIMESTAMP - INTERVAL '365 days' WHERE source_id = $1",
			[start_a]
		)

		// Path B: New connection (Just now)
		const start_b = await poly.addNode({ label: 'StartB', x: 100, y: 0, threshold: 0.1 })
		const end_b = await poly.addNode({ label: 'EndB', x: 100, y: 100, threshold: 0.1 })
		await poly.connect({ source_id: start_b, target_id: end_b, weight: 2.0 })

		// Manually set activation to 1.0 to ensure they ACT as sources
		await (poly as any).queryRaw('UPDATE brain.nodes SET activation = 1.0 WHERE id IN ($1, $2)', [
			start_a,
			start_b
		])

		// Run tick with a very low threshold to ensure potential is captured
		// Signal = activation * weight * factor / (distance + 0.1)
		// Distance = 1.0 / (weight + 0.1) = 1.0 / 2.1 = 0.476
		// Denominator = 0.476 + 0.1 = 0.576
		// Factor B = 1.0
		// Potential B = 1.0 * 2.0 * 1.0 / 0.576 = 3.47 (Capped at 2.0)
		await poly.tick(0.01)

		const nodes = await poly.getAllNodes()
		const node_a = nodes.find(n => n.id === end_a)
		const node_b = nodes.find(n => n.id === end_b)

		// Check potential before it gets reset by activation if any
		// Actually, in sql_tick, activation happens AFTER potential update.
		// If threshold is 0.01, end_b potential will surely trigger activation.
		// BUT we want to see potential. In sql_tick:
		// activation = CASE WHEN potential > threshold THEN 1.0 ELSE 0.0 END
		// potential = CASE WHEN potential > threshold THEN 0.0 ELSE potential * 0.9 END
		// So if potential > 0.01, it becomes 0.

		// To test potential, we should use a threshold HIGHER than the expected potential.
		await (poly as any).queryRaw('UPDATE brain.nodes SET potential = 0, activation = 0 WHERE id IN ($1, $2)', [
			end_a,
			end_b
		])
		await (poly as any).queryRaw('UPDATE brain.nodes SET activation = 1.0 WHERE id IN ($1, $2)', [
			start_a,
			start_b
		])
		await poly.tick(5.0) // Very high threshold so potential remains

		const nodes_final = await poly.getAllNodes()
		const final_a = nodes_final.find(n => n.id === end_a)
		const final_b = nodes_final.find(n => n.id === end_b)

		expect(final_b!.potential).toBeGreaterThan(0)
		expect(final_b!.potential).toBeGreaterThan(final_a!.potential)
	})
})
