import { afterEach, beforeEach, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { getTestKeywords, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe('Polywise Temporal Mechanics', () => {
	let poly: Polywise
	const test_dir = getDataDir()

	beforeEach(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: test_dir,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			},
			keyword_config: {
				type: 'custom',
				fn: getTestKeywords
			}
		})
	})

	afterEach(async () => {
		await poly.off()
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
		const node_id = await poly.addNode({ label, x: 0, y: 0 })

		const nodes_initial = await poly.getAllNodes()
		const node_initial = nodes_initial.find(n => n.label === label)
		const initialUpdatedAt = new Date(node_initial!.updated_at!).getTime()

		await new Promise(resolve => setTimeout(resolve, 1100))

		await (poly as any).queryRaw(
			`
			INSERT INTO brain.nodes (id, label, context_id, x, y, potential, updated_at)
			VALUES ($2, $1, 'global', 0, 0, 1.0, CURRENT_TIMESTAMP)
			ON CONFLICT (label, context_id) DO UPDATE SET 
				potential = brain.nodes.potential + 0.5,
				updated_at = CURRENT_TIMESTAMP
		`,
			[label, `temp_${node_id}`]
		)

		const nodes_final = await poly.getAllNodes()
		const node_final = nodes_final.find(n => n.label === label)
		const finalUpdatedAt = new Date(node_final!.updated_at!).getTime()

		expect(finalUpdatedAt).toBeGreaterThan(initialUpdatedAt)
	})
})
