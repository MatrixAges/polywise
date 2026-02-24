import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { INPUT_DECAY_THRESHOLD, REFRACTORY_PERIOD_MS } from '../src/consts'
import Polywise from '../src/Polywise'
import { getTestKeywords, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe('Biological Activation and Threshold Decay', () => {
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

	it('should link nodes to article_ids upon keyword injection', async () => {
		const content = 'Biological neurons have axons and dendrites.'
		const article_id = await poly.save({ content })

		const nodes = await poly.getAllNodes()
		const axon_node = nodes.find(n => n.label === 'axons')

		expect(axon_node).toBeDefined()
		expect(axon_node!.article_ids).toContain(article_id)
	})

	it('should respect the lock attribute during decay', async () => {
		const node_a = await poly.addNode({ label: 'LockedNode', x: 0, y: 0, lock: true })
		const node_b = await poly.addNode({ label: 'NormalNode', x: 10, y: 10, lock: false })

		await poly.connect({ source_id: node_a, target_id: node_b, weight: 1.0, lock: true })
		await poly.connect({ source_id: node_b, target_id: node_a, weight: 1.0, lock: false })

		// Trigger decay by reaching threshold
		for (let i = 0; i <= INPUT_DECAY_THRESHOLD; i++) {
			await poly.tick(5.0) // High threshold to prevent firing, just increment count
		}

		const snapshot = await poly.getSnapshot(0)
		const locked_edge = snapshot.edges.find(e => e.source_id === node_a && e.target_id === node_b)
		const normal_edge = snapshot.edges.find(e => e.source_id === node_b && e.target_id === node_a)

		expect(locked_edge!.weight).toBe(1.0) // Should not change
		expect(normal_edge!.weight).toBeLessThan(1.0) // Should decay
	})

	it('should implement refractory period (nodes cannot fire too rapidly)', async () => {
		const node_id = await poly.addNode({ label: 'FastNode', x: 0, y: 0, threshold: 0.1 })

		// 1st tick: Stimulate and fire
		await poly.stimulate(node_id, 1.0)
		await poly.tick(0.1)

		const nodes_after_1 = await poly.getAllNodes()
		const node_1 = nodes_after_1.find(n => n.id === node_id)
		expect(node_1!.potential).toBeLessThan(0)

		// 2nd tick: Stimulate again immediately
		await poly.stimulate(node_id, 1.0)
		await poly.tick(0.1)

		const nodes_after_2 = await poly.getAllNodes()
		const node_2 = nodes_after_2.find(n => n.id === node_id)
		// Should NOT fire because of refractory period (default 500ms, ticks are fast)
		expect(node_2!.potential).toBeGreaterThanOrEqual(0)

		// Wait for refractory period to pass
		await new Promise(resolve => setTimeout(resolve, REFRACTORY_PERIOD_MS + 100))

		// 3rd tick: Stimulate and fire again
		await poly.stimulate(node_id, 1.0)
		await poly.tick(0.1)

		const nodes_after_3 = await poly.getAllNodes()
		const node_3 = nodes_after_3.find(n => n.id === node_id)
		expect(node_3!.potential).toBeLessThan(0)
	})

	it('should demonstrate energy diffusion loss (global decay rate)', async () => {
		const start = await poly.addNode({ label: 'Source', x: 0, y: 0, threshold: 0.1 })
		const mid = await poly.addNode({ label: 'Mid', x: 50, y: 0, threshold: 5.0 }) // High threshold so it doesn't fire but accumulates

		// Connect with weight 1.0, distance will be ~1.0
		await poly.connect({ source_id: start, target_id: mid, weight: 1.0 })

		// Set source as active
		await (poly as any).queryRaw('UPDATE brain.nodes SET activation = 1.0 WHERE id = $1', [start])

		await poly.tick(10.0) // Source fires -> Mid receives energy

		const nodes = await poly.getAllNodes()
		const mid_node = nodes.find(n => n.id === mid)

		// Expected potential = activation(1.0) * weight(1.0) * global_decay(0.8) / (dist(1.0/1.1) + 0.1)
		// Dist = 0.909, Denom = 1.009
		// Potential = 0.8 / 1.009 ≈ 0.79
		expect(mid_node!.potential).toBeLessThan(1.0)
		expect(mid_node!.potential).toBeGreaterThan(0.5)
	})
})
