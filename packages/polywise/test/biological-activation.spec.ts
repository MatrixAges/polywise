import { describe, expect, it } from '@rstest/core'

import { INPUT_DECAY_THRESHOLD, MAX_ACTIVE_LIMIT, REFRACTORY_PERIOD_MS } from '../src/consts'
import Polywise from '../src/Polywise'
import { getTestKeywords, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Biological Activation and Threshold Decay', () => {
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

	it('should link nodes to article_ids upon keyword injection', async () => {
		const poly = await createPoly()

		try {
			const content = 'Biological neurons have axons and dendrites.'
			const article_id = await poly.save({ content })

			const nodes = await poly.getAllNodes()
			const axon_node = nodes.find(n => n.label === 'axons')

			expect(axon_node).toBeDefined()
			expect(axon_node!.article_ids).toContain(article_id)
		} finally {
			await poly.off()
		}
	})

	it('should respect the lock attribute during decay', async () => {
		const poly = await createPoly()

		try {
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
			expect(normal_edge!.weight).toBeLessThan(1.0)
		} finally {
			await poly.off()
		}
	})

	it('should implement refractory period (nodes cannot fire too rapidly)', async () => {
		const poly = await createPoly()

		try {
			const node_id = await poly.addNode({ label: 'FastNode', x: 0, y: 0, threshold: 0.1 })

			await poly.stimulate(node_id, 1.0)
			await poly.tick(0.1)

			const nodes_after_1 = await poly.getAllNodes()
			const node_1 = nodes_after_1.find(n => n.id === node_id)
			expect(node_1!.is_active).toBe(true)

			await poly.stimulate(node_id, 1.0)
			await poly.tick(0.1)

			const nodes_after_2 = await poly.getAllNodes()
			const node_2 = nodes_after_2.find(n => n.id === node_id)
			expect(node_2!.is_active).toBe(false)

			const start_time = Date.now()
			while (Date.now() - start_time < REFRACTORY_PERIOD_MS + 200) {
				await poly.tick(0.1)
				await new Promise(resolve => setTimeout(resolve, 50))
			}

			await poly.stimulate(node_id, 1.0)
			const max_ticks = 6
			let fired_again = false

			for (let i = 0; i < max_ticks; i++) {
				await poly.tick(0.1)

				const nodes_after_3 = await poly.getAllNodes()
				const node_3 = nodes_after_3.find(n => n.id === node_id)
				if (node_3?.is_active) {
					fired_again = true
					break
				}
			}

			expect(fired_again).toBe(true)
		} finally {
			await poly.off()
		}
	})

	it('should demonstrate energy diffusion loss (global decay rate)', async () => {
		const poly = await createPoly()

		try {
			const start = await poly.addNode({ label: 'Source', x: 0, y: 0, threshold: 0.5 })
			const mid = await poly.addNode({ label: 'Mid', x: 50, y: 0, threshold: 5.0 })

			await poly.connect({ source_id: start, target_id: mid, weight: 1.0 })

			await poly.stimulate(start, 1.0)
			await poly.tick(0.3)

			const nodes = await poly.getAllNodes()
			const mid_node = nodes.find(n => n.id === mid)

			expect(mid_node!.potential).not.toBe(0)
		} finally {
			await poly.off()
		}
	})

	it('should dampen propagation under high global inhibition', async () => {
		const low_poly = await createPoly()
		const high_poly = await createPoly()

		try {
			const low_start = await low_poly.addNode({ label: 'Low_Start', x: 0, y: 0, threshold: 0.1 })
			const low_mid = await low_poly.addNode({ label: 'Low_Mid', x: 50, y: 0, threshold: 5.0 })

			await low_poly.connect({ source_id: low_start, target_id: low_mid, weight: 1.0 })
			await low_poly.stimulate(low_start, 2.0)
			await low_poly.tick(0.1)
			await low_poly.tick(0.1)

			const low_nodes = await low_poly.getAllNodes()
			const low_mid_node = low_nodes.find(n => n.id === low_mid)
			const low_mid_potential = low_mid_node ? low_mid_node.potential : 0

			const high_start = await high_poly.addNode({ label: 'High_Start', x: 0, y: 0, threshold: 0.1 })
			const high_mid = await high_poly.addNode({ label: 'High_Mid', x: 50, y: 0, threshold: 5.0 })

			await high_poly.connect({ source_id: high_start, target_id: high_mid, weight: 1.0 })

			const extra_nodes: Array<string> = []
			const total_extra = MAX_ACTIVE_LIMIT + 20

			for (let i = 0; i < total_extra; i++) {
				const node_id = await high_poly.addNode({
					label: `Inhibit_${i}`,
					x: i * 2,
					y: i * 2,
					threshold: 0.1
				})
				extra_nodes.push(node_id)
			}

			await high_poly.activation.stimulate([high_start, ...extra_nodes], 2.0)
			await high_poly.tick(0.1)
			await high_poly.tick(0.1)

			const high_nodes = await high_poly.getAllNodes()
			const high_mid_node = high_nodes.find(n => n.id === high_mid)
			const high_mid_potential = high_mid_node ? high_mid_node.potential : 0

			expect(high_mid_potential).toBeLessThan(low_mid_potential)
		} finally {
			await low_poly.off()
			await high_poly.off()
		}
	})
})
