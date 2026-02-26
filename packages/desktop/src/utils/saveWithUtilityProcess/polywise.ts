import path from 'path'
import chalk from 'chalk'
import { pathExistsSync } from 'fs-extra'
import workerpool from 'workerpool'

import type {
	ForgetArticleArgs,
	GetNodeRelatedArgs,
	ProcessArticleArgs,
	QueryArgs,
	RecallArgs,
	UpdateArticleArgs
} from 'polywise'

type MemoryMethod = 'init' | 'save' | 'query' | 'update' | 'forget' | 'getSnapshot' | 'recall' | 'getNodeRelated'

type SnapshotArgs = {
	weight_threshold?: number
	limit?: number
}

const getWorkerPath = () => {
	const candidate_paths = [path.join(__dirname, 'polywise.js'), path.join(__dirname, 'dist/polywise.js')]

	const resolved_path = candidate_paths.find(candidate_path => pathExistsSync(candidate_path))

	return resolved_path || candidate_paths[0]
}

export default class PolySaveUtilityProcess {
	private pool: workerpool.Pool | null = null

	private log_enabled = process.env.NODE_ENV === 'development'

	private writeLog(event_name: string, payload?: Record<string, unknown>) {
		if (!this.log_enabled) return

		const timestamp = chalk.gray(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`)
		const tag = chalk.cyan('[memory-bridge]')
		const event = chalk.yellow(event_name)

		console.log(`${timestamp} ${tag} ${event}`)

		if (payload) {
			console.log(
				JSON.stringify(payload, null, 2)
					.split('\n')
					.map(line => chalk.gray('  ' + line))
					.join('\n')
			)
		}
	}

	private ensurePool() {
		if (this.pool) return

		const worker_path = getWorkerPath()

		this.writeLog('pool_create_start', { worker_path })

		this.pool = workerpool.pool(worker_path, {
			workerType: 'process',
			maxWorkers: 1,
			forkOpts: {
				execArgv: ['--max-old-space-size=8192'],
				stdio: 'inherit'
			}
		})

		this.writeLog('pool_created')
	}

	async save(input: ProcessArticleArgs, data_dir: string) {
		return await this.callMemory('save', input, data_dir)
	}

	async init(data_dir: string) {
		return await this.callMemory('init', undefined, data_dir)
	}

	async query(input: QueryArgs, data_dir: string) {
		return await this.callMemory('query', input, data_dir)
	}

	async update(input: UpdateArticleArgs, data_dir: string) {
		return await this.callMemory('update', input, data_dir)
	}

	async forget(input: ForgetArticleArgs, data_dir: string) {
		return await this.callMemory('forget', input, data_dir)
	}

	async snapshot(input: SnapshotArgs, data_dir: string) {
		return await this.callMemory('getSnapshot', input, data_dir)
	}

	async recall(input: RecallArgs, data_dir: string) {
		return await this.callMemory('recall', input, data_dir)
	}

	async getNodeRelated(input: GetNodeRelatedArgs, data_dir: string) {
		return await this.callMemory('getNodeRelated', input, data_dir)
	}

	private async callMemory(method: MemoryMethod, args: unknown, data_dir: string) {
		this.ensurePool()

		this.writeLog('call_exec_start', { method })

		try {
			const result = await this.pool!.exec('exec', [method, args, data_dir])

			this.writeLog('call_exec_done', { method })

			return result
		} catch (error) {
			this.writeLog('call_exec_error', {
				method,
				error: error instanceof Error ? error.message : String(error)
			})

			throw error
		}
	}

	async off() {
		if (this.pool) {
			await this.pool.terminate()
			this.pool = null
		}
	}
}
