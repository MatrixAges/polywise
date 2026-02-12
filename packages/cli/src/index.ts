import '@abraham/reflection'

import { Command } from 'commander'

import type { PolywiseArgs } from 'polywise'

const program = new Command()

program.name('polywise-cli').description('Polywise CLI Server').version('0.0.1')

program
	.command('serve')
	.description('Start the Polywise server')
	.option('-p, --port <number>', 'Port to listen on', '3000')
	.option('-d, --data-dir <path>', 'Path to data directory', './data')
	.option('-c, --cache-dir <path>', 'Path to cache directory', './cache')
	.option('--ec <number>', 'Embedding concurrency', '2')
	.option('--rc <number>', 'Reranker concurrency', '2')
	.option('--dc <number>', 'Decision concurrency', '2')
	.option('--log', 'Enable logging')
	.action(async options => {
		const port = parseInt(options.port)
		const polywiseArgs: PolywiseArgs = {
			data_dir: options.dataDir,
			cache_dir: options.cacheDir,
			embedding_concurrency: parseInt(options.ec),
			reranker_concurrency: parseInt(options.rc),
			decision_concurrency: parseInt(options.dc),
			log: options.log ? true : false
		}

		console.log(`Starting Polywise server on port ${port}...`)
		console.log('Configuration:', polywiseArgs)

		try {
			const { createServer } = await import('./server')
			const { app } = await createServer({
				port,
				polywise: polywiseArgs
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

program.parse(process.argv)
