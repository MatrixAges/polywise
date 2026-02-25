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

		for (let i = 0; i <= INPUT_DECAY_THRESHOLD; i++) {
			await poly.tick(5.0)
		}

		const snapshot = await poly.getSnapshot(0)
		const locked_edge = snapshot.edges.find(e => e.source_id === node_a && e.target_id === node_b)
		const normal_edge = snapshot.edges.find(e => e.source_id === node_b && e.target_id === node_a)

		expect(locked_edge!.weight).toBe(1.0)
		expect(normal_edge!.weight).toBeGreaterThan(1.0)
	})

	it('should implement refractory period (nodes cannot fire too rapidly)', async () => {
		const node_id = await poly.addNode({ label: 'FastNode', x: 0, y: 0, threshold: 0.1 })

		// 1st tick: Stimulate and fire
		await poly.stimulate(node_id, 1.0)
		await poly.tick(0.1)

		const nodes_after_1 = await poly.getAllNodes()
		const node_1 = nodes_after_1.find(n => n.id === node_id)
		expect(node_1!.is_active).toBe(true)

		// 2nd tick: Stimulate again immediately
		await poly.stimulate(node_id, 1.0)
		await poly.tick(0.1)

		const nodes_after_2 = await poly.getAllNodes()
		const node_2 = nodes_after_2.find(n => n.id === node_id)
		// Should NOT fire because of refractory period (default 500ms, ticks are fast)
		expect(node_2!.is_active).toBe(false)

		// Wait for refractory period to pass and thresholds to decay
		const start_time = Date.now()
		while (Date.now() - start_time < REFRACTORY_PERIOD_MS + 200) {
			await poly.tick(0.1)
			await new Promise(resolve => setTimeout(resolve, 50))
		}

		// 3rd tick: Stimulate and fire again
		await poly.stimulate(node_id, 1.0)
		await poly.tick(0.1)

		const nodes_after_3 = await poly.getAllNodes()
		const node_3 = nodes_after_3.find(n => n.id === node_id)
		expect(node_3!.is_active).toBe(true)
	})

	it('should demonstrate energy diffusion loss (global decay rate)', async () => {
		const start = await poly.addNode({ label: 'Source', x: 0, y: 0, threshold: 0.5 })
		const mid = await poly.addNode({ label: 'Mid', x: 50, y: 0, threshold: 5.0 })

		await poly.connect({ source_id: start, target_id: mid, weight: 1.0 })

		await poly.stimulate(start, 1.0)
		await poly.tick(0.3)

		const nodes = await poly.getAllNodes()
		const mid_node = nodes.find(n => n.id === mid)

		expect(mid_node!.potential).not.toBe(0)
	})
})
