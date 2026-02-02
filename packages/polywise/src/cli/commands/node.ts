import { Command } from 'commander'

import { default as Polywise } from '../../Polywise'

export function createNodeCommand(): Command {
	const command = new Command('node')

	command
		.command('add')
		.description('Add a new node')
		.argument('<label>', 'Node label')
		.argument('<x>', 'X coordinate')
		.argument('<y>', 'Y coordinate')
		.option('-t, --threshold <number>', 'Activation threshold', '0.5')
		.action(async (label: string, x: string, y: string, options: { threshold?: string }) => {
			const poly = new Polywise()
			await poly.init({})

			const node_id = await poly.addNode({
				label,
				x: parseFloat(x),
				y: parseFloat(y),
				threshold: parseFloat(options.threshold || '0.5')
			})

			console.log('✓ Node added successfully!')
			console.log(`   ID: ${node_id}`)
			console.log(`   Label: ${label}`)
			console.log(`   Position: (${x}, ${y})`)
			console.log(`   Threshold: ${options.threshold || '0.5'}`)

			await poly.off()
		})

	command
		.command('connect')
		.description('Connect two nodes')
		.argument('<source_id>', 'Source node ID')
		.argument('<target_id>', 'Target node ID')
		.option('-w, --weight <number>', 'Edge weight', '1.0')
		.action(async (sourceId: string, targetId: string, options: { weight?: string }) => {
			const poly = new Polywise()
			await poly.init({})

			await poly.connect({
				source_id: parseInt(sourceId, 10),
				target_id: parseInt(targetId, 10),
				weight: parseFloat(options.weight || '1.0')
			})

			console.log('✓ Nodes connected successfully!')
			console.log(`   Source: ${sourceId}`)
			console.log(`   Target: ${targetId}`)
			console.log(`   Weight: ${options.weight || '1.0'}`)

			await poly.off()
		})

	command
		.command('get <id>')
		.description('Get node by ID')
		.action(async (id: string) => {
			const poly = new Polywise()
			await poly.init({})

			const nodes = await poly.getAllNodes()
			const node = nodes.find(n => n.id === parseInt(id, 10))

			if (!node) {
				console.error(`Node with ID ${id} not found.`)
				await poly.off()
				process.exit(1)
			}

			console.log('\nNode:')
			console.log('─'.repeat(80))
			console.log(`ID: ${node.id}`)
			console.log(`Label: ${node.label}`)
			console.log(`Position: (${node.x}, ${node.y})`)
			console.log(`Potential: ${node.potential}`)
			console.log(`Activation: ${node.activation}`)
			console.log(`Threshold: ${node.threshold}`)

			await poly.off()
		})

	command
		.command('list')
		.description('List all nodes')
		.option('-l, --limit <number>', 'Maximum results', '20')
		.action(async (options: { limit?: string }) => {
			const poly = new Polywise()
			await poly.init({})

			const nodes = await poly.getAllNodes()

			if (nodes.length === 0) {
				console.log('No nodes found.')
				await poly.off()
				return
			}

			const limitedNodes = nodes.slice(0, parseInt(options.limit || '20', 10))

			console.log(`Nodes (${limitedNodes.length}/${nodes.length}):`)
			console.log('─'.repeat(80))

			for (const node of limitedNodes) {
				console.log(`[${node.id}] ${node.label} at (${node.x}, ${node.y})`)
				console.log(
					`   Potential: ${node.potential.toFixed(3)}, Activation: ${node.activation.toFixed(3)}`
				)
				console.log('')
			}

			await poly.off()
		})

	return command
}
