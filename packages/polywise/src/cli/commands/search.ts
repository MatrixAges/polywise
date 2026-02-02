import { Command } from 'commander'

import Polywise from '../../Polywise'

export function createSearchCommand(): Command {
	const command = new Command('search')

	command
		.description('Search articles in the knowledge base')
		.argument('<query>', 'Search query')
		.option('-l, --limit <number>', 'Maximum results', '10')
		.action(async (query: string, options: { limit?: string }) => {
			const poly = new Polywise()
			await poly.init({})

			const limit = parseInt(options.limit || '10', 10)

			console.log(`Searching for: "${query}"`)
			console.log('')

			const searchResult = await poly.search({ query, search_limit: limit })

			const results = searchResult.result

			if (results.length === 0) {
				console.log('No results found.')
				await poly.off()
				return
			}

			console.log(`Found ${results.length} results:`)
			console.log('─'.repeat(80))

			for (let i = 0; i < results.length; i++) {
				const result = results[i]
				const score = (result.combinedScore * 100).toFixed(1)
				console.log(`${i + 1}. [${result.id}] ${result.title} (score: ${score}%)`)
				if (result.content.length > 200) {
					console.log(`   ${result.content.substring(0, 200)}...`)
				} else {
					console.log(`   ${result.content}`)
				}
				console.log('')
			}

			await poly.off()
		})

	return command
}
