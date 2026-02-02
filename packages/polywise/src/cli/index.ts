import 'reflect-metadata'

import { Command } from 'commander'

import Polywise from '../Polywise'
import { createArticleCommand } from './commands/article'
import { createConfigCommand } from './commands/config'
import { createModelsCommand } from './commands/models'
import { createNodeCommand } from './commands/node'
import { createSearchCommand } from './commands/search'

async function main() {
	const program = new Command()

	program.name('polywise').description('Polywise CLI - Knowledge graph and memory system').version('0.1.0')

	program.addCommand(createModelsCommand())
	program.addCommand(createSearchCommand())
	program.addCommand(createArticleCommand())
	program.addCommand(createNodeCommand())
	program.addCommand(createConfigCommand())

	program
		.command('stats')
		.description('Show Polywise statistics')
		.action(async () => {
			const poly = new Polywise()
			await poly.init({})

			const stats = await poly.getStats()

			console.log('\nPolywise Statistics:')
			console.log('─'.repeat(80))
			console.log(`Nodes: ${stats.node_count}`)
			console.log(`Edges: ${stats.edge_count}`)
			console.log(`Articles: ${stats.article_count}`)
			console.log(`Memory usage: ${(stats.memory_usage / 1024 / 1024).toFixed(2)} MB`)

			await poly.off()
		})

	program
		.command('init')
		.description('Initialize Polywise database')
		.action(async () => {
			const poly = new Polywise()
			await poly.init({})

			console.log('✓ Polywise initialized successfully!')
			console.log(`   Data directory: ${await poly.getDataDir()}`)

			await poly.off()
		})

	program
		.command('reset')
		.description('Reset Polywise database')
		.action(async () => {
			console.log('⚠ This will delete all data. Are you sure?')
			console.log('   Type "yes" to confirm, or anything else to cancel.')

			const readline = await import('readline')
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			})

			const answer = await new Promise<string>(resolve => {
				rl.question('> ', resolve)
			})
			rl.close()

			if (answer.toLowerCase() !== 'yes') {
				console.log('Cancelled.')
				process.exit(0)
			}

			const poly = new Polywise()
			await poly.init({})
			await poly.reset()
			await poly.off()

			console.log('✓ Polywise database reset successfully!')
		})

	program.parse()
}

main().catch(error => {
	console.error('Error:', error)
	process.exit(1)
})
