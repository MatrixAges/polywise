import os from 'os'
import to from 'await-to-js'
import { Command } from 'commander'
import { z } from 'zod'

import polywise from './polywise'
import { createServer } from './server'

const program = new Command()

const QuerySchema = z.object({
	query: z.string().min(1),
	recallDepth: z.coerce.number().int().nonnegative().default(0),
	searchLimit: z.coerce.number().int().positive().default(20),
	rerankLimit: z.coerce.number().int().positive().default(10),
	cotDepth: z.coerce.number().int().nonnegative().default(0),
	stimulateOnRecall: z.boolean().optional(),
	habitThreshold: z.coerce.number().min(0).max(1).optional(),
	idolId: z.string().optional(),
	rootIds: z.string().optional(),
	metricsIds: z.string().optional(),
	verbose: z.boolean().optional()
})

const SaveSchema = z.object({
	content: z.string().min(1),
	articleId: z.coerce.number().int().positive().optional(),
	idolId: z.string().optional(),
	rootIds: z.string().optional(),
	metricsIds: z.string().optional(),
	metadata: z.string().optional()
})

const DEFAULT_DATA_DIR = `${os.homedir()}/.polywise/:server:`
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

		const [server_err, server] = await to(
			createServer({
				port,
				polywise: { log: options.log ? true : false }
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
	.option('--cot-depth <number>', 'Chain of Thought depth', '0')
	.option('--stimulate-on-recall', 'Stimulate nodes on recall')
	.option('--habit-threshold <number>', 'Habit threshold')
	.option('--idol-id <string>', 'Idol ID')
	.option('--root-ids <string>', 'Comma-separated Root IDs')
	.option('--metrics-ids <string>', 'Comma-separated Metrics IDs')
	.option('--verbose', 'Enable verbose process logging')
	.action(async (query_str, options) => {
		const validation = QuerySchema.safeParse({ ...options, query: query_str })

		if (!validation.success) {
			console.error('Invalid input:', validation.error.format())

			process.exit(1)
		}

		const data = validation.data
		const query_process = polywise.process(data.query)

		if (data.verbose) {
			query_process.on(event => {
				const { key, value } = event

				if (key.startsWith('CoT')) {
					console.log(`${key}:`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value)
				} else {
					console.log(
						`[Process] ${key}:`,
						typeof value === 'object' ? JSON.stringify(value, null, 2) : value
					)
				}
			})
		}

		const [query_err, result] = await to(
			polywise.query({
				query: data.query,
				recall_depth: data.recallDepth,
				search_limit: data.searchLimit,
				rerank_limit: data.rerankLimit,
				cot_depth: data.cotDepth,
				stimulate_on_recall: data.stimulateOnRecall,
				habit_threshold: data.habitThreshold,
				idol_id: data.idolId,
				root_ids: data.rootIds ? data.rootIds.split(',') : undefined,
				metrics_ids: data.metricsIds ? data.metricsIds.split(',') : undefined,
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
	.option('--article-id <number>', 'Article ID')
	.option('--idol-id <string>', 'Idol ID')
	.option('--root-ids <string>', 'Comma-separated Root IDs')
	.option('--metrics-ids <string>', 'Comma-separated Metrics IDs')
	.option('--metadata <json>', 'Metadata JSON string')
	.action(async (content_str, options) => {
		const validation = SaveSchema.safeParse({ ...options, content: content_str })

		if (!validation.success) {
			console.error('Invalid input:', validation.error.format())

			process.exit(1)
		}

		const data = validation.data
		let metadata: Record<string, any> | undefined

		if (data.metadata) {
			try {
				metadata = JSON.parse(data.metadata)
			} catch (e) {
				console.error('Invalid metadata JSON:', e)

				process.exit(1)
			}
		}

		const [save_err] = await to(
			polywise.save({
				content: data.content,
				article_id: data.articleId,
				idol_id: data.idolId,
				root_ids: data.rootIds ? data.rootIds.split(',') : undefined,
				metrics_ids: data.metricsIds ? data.metricsIds.split(',') : undefined,
				metadata
			})
		)

		if (save_err) {
			console.error('Save error:', save_err)

			process.exit(1)
		}

		console.log('Content saved successfully.')
	})

program.parse(process.argv)
