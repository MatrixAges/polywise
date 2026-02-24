import { fork } from 'child_process'
import { randomUUID } from 'crypto'
import path from 'path'
import chalk from 'chalk'
import { pathExistsSync } from 'fs-extra'

import type { ChildProcess } from 'child_process'
import type { ProcessArticleArgs, QueryArgs } from 'polywise'

type PendingTask = {
	resolve: (data: unknown) => void
	reject: (error: Error) => void
	timeout_id: ReturnType<typeof setTimeout>
}

type SaveResultMessage = {
	type: 'memory_result'
	request_id: string
	ok: boolean
	data?: unknown
	error_message?: string
}

type SaveReadyMessage = {
	type: 'save_ready'
}

type MemoryMethod =
	| 'init'
	| 'save'
	| 'query'
	| 'update'
	| 'forget'
	| 'snapshot'
	| 'recall'
	| 'getNodes'
	| 'getNodesByIdol'
	| 'getEdgesByIdol'

type MemoryCallMessage = {
	type: 'memory_call'
	request_id: string
	data_dir: string
	method: MemoryMethod
	args: unknown
}

type UpdateArgs = {
	memory_id: string
	content: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	metadata?: Record<string, unknown>
}

type ForgetArgs = {
	memory_id?: string
	query?: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
}

type SnapshotArgs = {
	weight_threshold?: number
}

type RecallArgs = {
	query: string
	max_depth?: number
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	limit?: number
}

type IdolArgs = {
	idol_id: string
}

const getMessageType = (message: unknown) => {
	if (!message || typeof message !== 'object') return 'unknown'

	const typed_message = message as { type?: unknown }

	return typeof typed_message.type === 'string' ? typed_message.type : 'unknown'
}

const getWorkerPath = () => {
	const candidate_paths = [path.join(__dirname, 'polywise.js'), path.join(__dirname, 'dist/polywise.js')]

	const resolved_path = candidate_paths.find(candidate_path => pathExistsSync(candidate_path))

	return resolved_path || candidate_paths[0]
}

export default class PolySaveUtilityProcess {
	private child: ChildProcess | null = null

	private pending_map = new Map<string, PendingTask>()

	private save_queue = Promise.resolve()

	private request_timeout_ms = 600000

	private worker_ready_promise: Promise<void> | null = null

	private resolve_worker_ready: (() => void) | null = null

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

	private ensureWorker() {
		if (this.child) return

		const worker_path = getWorkerPath()
		this.writeLog('worker_spawn_start', { worker_path })

		this.worker_ready_promise = new Promise(resolve => {
			this.resolve_worker_ready = resolve
		})

		this.child = fork(worker_path, [], {
			execArgv: ['--max-old-space-size=8192'],
			stdio: 'pipe'
		})
		this.writeLog('worker_spawned', { pid: this.child.pid })

		this.child.stdout?.on('data', data => {
			process.stdout.write(data)
		})

		this.child.stderr?.on('data', data => {
			this.writeLog('worker_stderr', { message: data.toString().trim() })
		})

		this.child.on('message', message => {
			this.writeLog('worker_message', { message_type: getMessageType(message) })
			this.handleMessage(message)
		})

		this.child.on('exit', (code, signal) => {
			this.writeLog('worker_exit', { code, signal, pending_count: this.pending_map.size })
			this.rejectAll('polywise worker exited unexpectedly')
			this.worker_ready_promise = null
			this.resolve_worker_ready = null
			this.child = null
		})
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

	async update(input: UpdateArgs, data_dir: string) {
		return await this.callMemory('update', input, data_dir)
	}

	async forget(input: ForgetArgs, data_dir: string) {
		return await this.callMemory('forget', input, data_dir)
	}

	async snapshot(input: SnapshotArgs, data_dir: string) {
		return await this.callMemory('snapshot', input, data_dir)
	}

	async recall(input: RecallArgs, data_dir: string) {
		return await this.callMemory('recall', input, data_dir)
	}

	async getNodes(data_dir: string) {
		return await this.callMemory('getNodes', undefined, data_dir)
	}

	async getNodesByIdol(input: IdolArgs, data_dir: string) {
		return await this.callMemory('getNodesByIdol', input, data_dir)
	}

	async getEdgesByIdol(input: IdolArgs, data_dir: string) {
		return await this.callMemory('getEdgesByIdol', input, data_dir)
	}

	private async callMemory(method: MemoryMethod, args: unknown, data_dir: string) {
		this.writeLog('call_enqueue', { method, pending_count: this.pending_map.size })

		const run_task = async () => {
			return await this.executeCall(method, args, data_dir)
		}

		const queued_task = this.save_queue.then(run_task, run_task)

		this.save_queue = queued_task.then(
			() => undefined,
			() => undefined
		)

		return await queued_task
	}

	private async executeCall(method: MemoryMethod, args: unknown, data_dir: string) {
		this.ensureWorker()
		await this.waitForWorkerReady()

		return await new Promise<unknown>((resolve, reject) => {
			if (!this.child) {
				this.writeLog('call_reject_no_worker', { method })
				reject(new Error('polywise worker is unavailable'))
				return
			}

			const request_id = randomUUID()
			this.writeLog('call_send', { request_id, method })

			const timeout_id = setTimeout(() => {
				this.writeLog('call_timeout', { request_id, method })
				this.restartWorker('polywise worker timeout')
			}, this.request_timeout_ms)

			this.pending_map.set(request_id, { resolve, reject, timeout_id })

			const message: MemoryCallMessage = { type: 'memory_call', request_id, data_dir, method, args }

			this.child.send(message)
		})
	}

	private handleMessage(message: unknown) {
		if (!message || typeof message !== 'object') return

		const ready_message = message as Partial<SaveReadyMessage>

		if (ready_message.type === 'save_ready') {
			this.resolve_worker_ready?.()
			this.resolve_worker_ready = null
			return
		}

		const typed_message = message as Partial<SaveResultMessage>
		if (typed_message.type !== 'memory_result' || typeof typed_message.request_id !== 'string') return

		const task = this.pending_map.get(typed_message.request_id)
		if (!task) return

		this.pending_map.delete(typed_message.request_id)
		clearTimeout(task.timeout_id)
		this.writeLog('call_result', {
			request_id: typed_message.request_id,
			ok: Boolean(typed_message.ok)
		})

		if (typed_message.ok) {
			task.resolve(typed_message.data)
			return
		}

		task.reject(new Error(typed_message.error_message || 'polywise worker failed'))
	}

	private rejectAll(error_message: string) {
		this.writeLog('reject_all', { error_message, pending_count: this.pending_map.size })

		for (const [request_id, task] of this.pending_map.entries()) {
			clearTimeout(task.timeout_id)
			task.reject(new Error(error_message))
			this.pending_map.delete(request_id)
		}
	}

	private restartWorker(error_message: string) {
		this.writeLog('worker_restart', { error_message })

		if (this.child) {
			this.child.removeAllListeners()
			this.child.kill()
			this.child = null
		}

		this.rejectAll(error_message)
	}

	private async waitForWorkerReady() {
		if (!this.worker_ready_promise) throw new Error('polywise worker start failed')

		this.writeLog('worker_ready_wait_start')

		let timeout_id: ReturnType<typeof setTimeout> | null = null

		const timeout_promise = new Promise<void>((_, reject) => {
			timeout_id = setTimeout(() => {
				reject(new Error('polywise worker init timeout'))
			}, 10000)
		})

		try {
			await Promise.race([this.worker_ready_promise, timeout_promise])
			this.writeLog('worker_ready_wait_done')
		} finally {
			if (timeout_id) clearTimeout(timeout_id)
		}
	}
}
