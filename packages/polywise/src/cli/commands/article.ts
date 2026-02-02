import { Command } from 'commander'

import Polywise from '../../Polywise'

export function createArticleCommand(): Command {
	const command = new Command('article')

	command
		.command('add')
		.description('Add a new article')
		.argument('<title>', 'Article title')
		.argument('<content>', 'Article content')
		.action(async (title: string, content: string) => {
			const poly = new Polywise()
			await poly.init({})

			const article_id = await poly.article.add({ title, content })

			console.log('✓ Article added successfully!')
			console.log(`   ID: ${article_id}`)
			console.log(`   Title: ${title}`)

			await poly.off()
		})

	command
		.command('get <id>')
		.description('Get article by ID')
		.action(async (id: string) => {
			const poly = new Polywise()
			await poly.init({})

			const articles = await poly.article.get(parseInt(id, 10))

			if (articles.length === 0) {
				console.error(`Article with ID ${id} not found.`)
				await poly.off()
				process.exit(1)
			}

			const article = articles[0]
			console.log('\nArticle:')
			console.log('─'.repeat(80))
			console.log(`ID: ${article.id}`)
			console.log(`Title: ${article.title}`)
			console.log(`Content: ${article.content}`)
			console.log(`Created: ${article.created_at}`)

			await poly.off()
		})

	command
		.command('list')
		.description('List all articles')
		.option('-l, --limit <number>', 'Maximum results', '20')
		.action(async (options: { limit?: string }) => {
			const poly = new Polywise()
			await poly.init({})

			const articles = await poly.article.getAll()

			if (articles.length === 0) {
				console.log('No articles found.')
				await poly.off()
				return
			}

			const limitedArticles = articles.slice(0, parseInt(options.limit || '20', 10))

			console.log(`Articles (${limitedArticles.length}/${articles.length}):`)
			console.log('─'.repeat(80))

			for (const article of limitedArticles) {
				const contentPreview =
					article.content.length > 100 ? article.content.substring(0, 100) + '...' : article.content
				console.log(`[${article.id}] ${article.title}`)
				console.log(`   ${contentPreview}`)
				console.log(`   Created: ${article.created_at}`)
				console.log('')
			}

			await poly.off()
		})

	command
		.command('process <id>')
		.description('Process an article to generate embeddings')
		.action(async (id: string) => {
			const poly = new Polywise()
			await poly.init({})

			console.log(`Processing article ${id}...`)

			const articles = await poly.article.get(parseInt(id, 10))

			if (articles.length === 0) {
				console.error(`Article with ID ${id} not found.`)
				await poly.off()
				process.exit(1)
			}

			const article = articles[0]
			await poly.article.addEmbedding(parseInt(id, 10), article.content)

			console.log('✓ Article processed successfully!')
			console.log(`   ID: ${article.id}`)
			console.log(`   Title: ${article.title}`)

			await poly.off()
		})

	return command
}
