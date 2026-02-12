import '@abraham/reflection'

import os from 'os'
import to from 'await-to-js'
import { Command } from 'commander'
import { Polywise } from 'polywise'
import { container } from 'tsyringe'

const program = new Command()

const DEFAULT_DATA_DIR = `${os.homedir()}/.polywise/:database:`
const DEFAULT_CACHE_DIR = `${os.homedir()}/.polywise/.models`

program
	.name('polywise-cli')
	.description('Polywise CLI Server')
	.addHelpText(
		'after',
		`\nConfiguration:\n  Data Directory: ${DEFAULT_DATA_DIR}\n  Cache Directory: ${DEFAULT_CACHE_DIR}`
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

		const [import_err, server_module] = await to(import('./server'))

		if (import_err) {
			console.error('Failed to import server module:', import_err)
			process.exit(1)
		}

		const { createServer } = server_module

		const [server_err, server] = await to(
			createServer({
				port,
				polywise: {
					log: options.log ? true : false
				}
			})
		)

		if (server_err) {
			console.error('Failed to create server:', server_err)
			process.exit(1)
		}

		const { app } = server

		Bun.serve({
			port,
			fetch: app.fetch
		})

		console.log(`Server listening on http://localhost:${port}`)
	})

program
	.command('checkModels')
	.description('Check and download required models')
	.action(async () => {
		const polywise = container.resolve(Polywise)
		const [init_err] = await to(polywise.init())

		if (init_err) {
			console.error('Failed to initialize Polywise:', init_err)
			process.exit(1)
		}

		console.log('Checking models...')

		const start_time = Date.now()
		const interval = setInterval(() => {
			const elapsed = ((Date.now() - start_time) / 1000).toFixed(1)
			process.stdout.write(`\rDownload pending time: ${elapsed}s`)
		}, 100)

		const [check_err] = await to(polywise.pipeline.checkModels())

		clearInterval(interval)
		process.stdout.write('\n')

		if (check_err) {
			console.error('Failed to check/download models:', check_err)
			process.exit(1)
		}

		console.log('All models are ready.')
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
		const [init_err] = await to(polywise.init())

		if (init_err) {
			console.error('Failed to initialize Polywise:', init_err)
			process.exit(1)
		}

		const query_process = polywise.process(query)

		const [query_err, result] = await to(
			polywise.query({
				query,
				recall_depth: parseInt(options.recallDepth),
				search_limit: parseInt(options.searchLimit),
				rerank_limit: parseInt(options.rerankLimit),
				process: query_process
			})
		)

		if (query_err) {
			console.error('Query error:', query_err)
			process.exit(1)
		}

		console.log(JSON.stringify(result, null, 2))
	})

program
	.command('save')
	.description('Save content to memory')
	.argument('<content>', 'Content to save')
	.action(async content => {
		const polywise = container.resolve(Polywise)
		const [init_err] = await to(polywise.init())

		if (init_err) {
			console.error('Failed to initialize Polywise:', init_err)
			process.exit(1)
		}

		const [save_err] = await to(
			polywise.save({
				content
			})
		)

		if (save_err) {
			console.error('Save error:', save_err)
			process.exit(1)
		}

		console.log('Content saved successfully.')
	})

program.parse(process.argv)
