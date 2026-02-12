import '@abraham/reflection'

import os from 'os'
import { Command } from 'commander'
import { Polywise } from 'polywise'
import { container } from 'tsyringe'

const program = new Command()

const DEFAULT_DATA_DIR = `${os.homedir()}/.polywise/:database:`
const DEFAULT_CACHE_DIR = `${os.homedir()}/.polywise/.models`

program
	.name('polywise-cli')
	.description(
		`Polywise CLI Server\n\nDefault Data Directory: ${DEFAULT_DATA_DIR}\nDefault Cache Directory: ${DEFAULT_CACHE_DIR}`
	)
	.version('0.0.1')

program
	.command('serve')
	.description('Start the Polywise server')
	.option('-p, --port <number>', 'Port to listen on', '3000')
	.option('--log', 'Enable logging')
	.action(async options => {
		const port = parseInt(options.port)

		console.log(`Starting Polywise server on port ${port}...`)

		try {
			const { createServer } = await import('./server')
			const { app } = await createServer({
				port,
				polywise: {
					log: options.log ? true : false
				}
			})

			Bun.serve({
				port,
				fetch: app.fetch
			})

			console.log(`Server listening on http://localhost:${port}`)
		} catch (error) {
			console.error('Failed to start server:', error)

			process.exit(1)
		}
	})

program
	.command('checkModels')
	.description('Check and download required models')
	.action(async () => {
		const polywise = container.resolve(Polywise)

		await polywise.init()

		console.log('Checking models...')
		const startTime = Date.now()

		const interval = setInterval(() => {
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
			process.stdout.write(`\rDownload pending time: ${elapsed}s`)
		}, 100)

		try {
			await polywise.pipeline.checkModels()
			clearInterval(interval)
			process.stdout.write('\n')
			console.log('All models are ready.')
		} catch (error) {
			clearInterval(interval)
			process.stdout.write('\n')
			console.error('Failed to check/download models:', error)
			process.exit(1)
		}
	})

program
	.command('query')
	.description('Execute a query. Use --recall-depth > 0 for recall functionality.')
	.argument('<query>', 'Query string')
	.option('--recall-depth <number>', 'Depth of recall (default: 0)', '0')
	.option('--search-limit <number>', 'Search limit (default: 20)', '20')
	.option('--rerank-limit <number>', 'Rerank limit (default: 10)', '10')
	.action(async (query, options) => {
		const polywise = container.resolve(Polywise)
		await polywise.init()

		const process = polywise.process(query)

		try {
			const result = await polywise.query({
				query,
				recall_depth: parseInt(options.recallDepth),
				search_limit: parseInt(options.searchLimit),
				rerank_limit: parseInt(options.rerankLimit),
				process
			})

			console.log(JSON.stringify(result, null, 2))
		} catch (error) {
			console.error('Query error:', error)
			process.exit(1)
		}
	})

program
	.command('save')
	.description('Save content to memory')
	.argument('<content>', 'Content to save')
	.action(async content => {
		const polywise = container.resolve(Polywise)
		await polywise.init()

		try {
			await polywise.save({
				content
			})
			console.log('Content saved successfully.')
		} catch (error) {
			console.error('Save error:', error)
			process.exit(1)
		}
	})

program.parse(process.argv)
