import { PGlite } from '@electric-sql/pglite'

import { BrainController } from './BrainController'
import { Polywise } from './Polywise'

async function test() {
	const poly = new Polywise(':memory:')
	await poly.initSchema()

	const controller = new BrainController(poly, async () => {
		const { nodes, edges } = await poly.getSnapshot()
		const active = nodes.filter((n: any) => n.activation > 0).map((n: any) => n.label)
		if (active.length > 0) {
			console.log(`Active Nodes: [${active.join(', ')}] | Total Edges: ${edges.length}`)
		}
	})

	console.log('Simulating high-frequency input burst...')

	const node_a = await poly.addNode('Knowledge', 0, 0, 0.5)
	const node_b = await poly.addNode('Memory', 100, 100, 0.5)
	await poly.connect(node_a, node_b, 1.0)

	await poly.stimulate(node_a, 2.0)

	console.log('Starting Burst (100 ticks)...')
	await controller.triggerInputBurst()

	console.log('Burst complete. Waiting for Shadow Tick (optional)...')

	// Fast-forward or just exit
	controller.stop()
}

test().catch(console.error)
