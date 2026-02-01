import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { Brain } from '../src/Brain'
import { Polywise } from '../src/Polywise'

describe('Polywise Brain System', () => {
	let poly: Polywise
	let brain: Brain

	beforeAll(async () => {
		poly = new Polywise(':polywise:', 'engine')
		await poly.initSchema()

		brain = new Brain(poly, async () => {
			const { nodes, edges } = await poly.getSnapshot()
			const active = nodes.filter((n: any) => n.activation > 0).map((n: any) => n.label)
			if (active.length > 0) {
				console.log(`Active Nodes: [${active.join(', ')}] | Total Edges: ${edges.length}`)
			}
		})
	})

	afterAll(() => {
		brain?.stop()
	})

	it('should initialize schema correctly', async () => {
		const { nodes, edges } = await poly.getSnapshot()
		// Schema is initialized, database is ready
		expect(nodes).toBeDefined()
		expect(edges).toBeDefined()
	})

	it('should add nodes and connect them', async () => {
		const node_a = await poly.addNode('Knowledge_Add', 0, 0, 0.5)
		const node_b = await poly.addNode('Memory_Add', 100, 100, 0.5)
		await poly.connect(node_a, node_b, 1.0)

		const { nodes, edges } = await poly.getSnapshot()
		expect(nodes.length).toBeGreaterThanOrEqual(2)
		expect(edges.length).toBeGreaterThanOrEqual(1)
	})

	it('should stimulate node', async () => {
		const node_a = await poly.addNode('TestNode_Stimulate', 50, 50, 0.5)
		await poly.stimulate(node_a, 2.0)

		const { nodes } = await poly.getSnapshot()
		const testNode = nodes.find((n: any) => n.id === node_a)
		expect(testNode?.potential).toBeGreaterThan(0)
	})

	it('should process article with triples', async () => {
		const triples = [
			{
				subject: 'Electron_Process',
				predicate: 'uses',
				object: 'Chromium_Process',
				learning_rate: 0.8,
				decay_resistance: 2.0
			}
		]

		await poly.processArticle('Test Article Process', 'Test content', triples)

		const { nodes, edges } = await poly.getSnapshot()
		expect(nodes.length).toBeGreaterThanOrEqual(2)
		expect(edges.length).toBeGreaterThanOrEqual(1)
	})

	it('should handle input burst', async () => {
		const node_c = await poly.addNode('Concept_Burst', 200, 200, 0.5)
		const node_d = await poly.addNode('Idea_Burst', 300, 300, 0.5)
		await poly.connect(node_c, node_d, 0.8)
		await poly.stimulate(node_c, 2.0)

		await brain.triggerInputBurst(50)

		const { nodes } = await poly.getSnapshot()
		const conceptNode = nodes.find((n: any) => n.label === 'Concept_Burst')
		expect(conceptNode).toBeDefined()
	})
})
