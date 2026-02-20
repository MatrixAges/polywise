import { makeAutoObservable, runInAction, toJS } from 'mobx'
import { injectable } from 'tsyringe'
import { v7 as uuid } from 'uuid'

import { Util } from '@/models/common'
import { ipc } from '@/utils'

export interface ITask {
	id: string
	type: 'save' | 'update'
	args:
		| {
				content: string
				idol_id?: string
				root_ids?: Array<string>
				metrics_ids?: Array<string>
				metadata?: Record<string, unknown>
		  }
		| {
				memory_id: string
				content: string
				idol_id?: string
				root_ids?: Array<string>
				metadata?: Record<string, unknown>
		  }
	status: 'pending' | 'processing' | 'failed' | 'complete'
	error?: string
	created_at: number
}

@injectable()
export default class MemoryModel {
	tasks = [] as Array<ITask>
	is_processing = false
	task_timeout_ms = 600000

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		await this.loadTasks()

		void this.processQueue()
	}

	async loadTasks() {
		try {
			const { pending, processing } = await ipc.memory.getTasks.query()
			runInAction(() => {
				const all_tasks = [...pending, ...processing].map(t => ({
					...t,
					status: t.status as 'pending' | 'processing'
				})) as ITask[]
				this.tasks = all_tasks
			})
		} catch (error) {
			this.writeLog('load_tasks_error', { error: error instanceof Error ? error.message : String(error) })
		}
	}

	async processQueue() {
		if (this.is_processing) return

		const task = this.tasks.find(t => t.status === 'pending')

		if (!task) return

		this.is_processing = true

		runInAction(() => {
			task.status = 'processing'
		})

		this.writeLog('queue_task_start', { task_id: task.id, task_type: task.type })

		try {
			const task_args = this.toSerializableTaskArgs(task.args)

			if (task.type === 'save') {
				this.writeLog('queue_task_send_save', { task_id: task.id })

				await this.withTaskTimeout(
					ipc.memory.save.mutate(
						task_args as {
							content: string
							idol_id?: string
							root_ids?: Array<string>
							metrics_ids?: Array<string>
							metadata?: Record<string, unknown>
						}
					),
					'save'
				)

				this.writeLog('queue_task_done_save', { task_id: task.id })
			} else if (task.type === 'update') {
				this.writeLog('queue_task_send_update', { task_id: task.id })

				await this.withTaskTimeout(
					ipc.memory.update.mutate(
						task_args as {
							memory_id: string
							content: string
							idol_id?: string
							root_ids?: Array<string>
							metrics_ids?: Array<string>
							metadata?: Record<string, unknown>
						}
					),
					'update'
				)

				this.writeLog('queue_task_done_update', { task_id: task.id })
			}

			runInAction(() => {
				this.tasks = this.tasks.filter(item => item.id !== task.id)
				this.saveTasks()
			})
			void ipc.memory.archiveTask.mutate({
				task: {
					...task,
					args: task_args,
					status: 'complete'
				} as ITask
			})
		} catch (error: unknown) {
			this.writeLog('queue_task_error', {
				task_id: task.id,
				task_type: task.type,
				error: error instanceof Error ? error.message : String(error)
			})

			runInAction(() => {
				task.status = 'failed'
				task.error = error instanceof Error ? error.message : String(error)
				this.tasks = this.tasks.filter(item => item.id !== task.id)
				this.saveTasks()
			})
			void ipc.memory.archiveTask.mutate({
				task: {
					...task,
					args: task_args
				} as ITask
			})
		} finally {
			this.is_processing = false

			setTimeout(this.processQueue, 1000)
		}
	}

	saveTasks() {
		const pending = this.tasks.filter(t => t.status === 'pending')
		const processing = this.tasks.filter(t => t.status === 'processing')

		void ipc.memory.syncTasks.mutate({ pending: toJS(pending), processing: toJS(processing) })
	}

	addTask(type: ITask['type'], args: ITask['args']) {
		const task: ITask = {
			id: uuid(),
			type,
			args: toJS(args),
			status: 'pending',
			created_at: Date.now()
		}

		this.tasks.push(task)

		this.saveTasks()
		this.processQueue()
	}

	removeTask(task_id: string) {
		const task = this.tasks.find(item => item.id === task_id)

		if (!task) return

		if (task.status === 'processing') return

		this.tasks = this.tasks.filter(item => item.id !== task_id)
		this.saveTasks()
	}

	async query(args: { query: string; idol_id?: string; root_ids?: Array<string>; metrics_ids?: Array<string> }) {
		this.writeLog('query_start')

		try {
			const result = await this.withTaskTimeout(ipc.memory.query.query(toJS(args)), 'query')

			this.writeLog('query_done')

			return result
		} catch (error) {
			this.writeLog('query_error', { error: error instanceof Error ? error.message : String(error) })

			throw error
		}
	}

	async forget(args: {
		memory_id?: string
		query?: string
		idol_id?: string
		root_ids?: Array<string>
		metrics_ids?: Array<string>
	}) {
		return await ipc.memory.forget.mutate(toJS(args))
	}

	async recall(args: {
		query: string
		max_depth?: number
		idol_id?: string
		root_ids?: Array<string>
		metrics_ids?: Array<string>
		limit?: number
	}) {
		return await ipc.memory.recall.query(toJS(args))
	}

	async snapshot(args?: { weight_threshold?: number }) {
		return await ipc.memory.snapshot.query(toJS(args || {}))
	}

	async getNodes() {
		return await ipc.memory.getNodes.query()
	}

	async getNodesByIdol(idol_id: string) {
		return await ipc.memory.getNodesByIdol.query({ idol_id })
	}

	async getEdgesByIdol(idol_id: string) {
		return await ipc.memory.getEdgesByIdol.query({ idol_id })
	}

	private toSerializableTaskArgs(args: ITask['args']) {
		const plain_args = toJS(args)

		return JSON.parse(JSON.stringify(plain_args)) as ITask['args']
	}

	private async withTaskTimeout<T>(task_promise: Promise<T>, task_type: string) {
		let timeout_id: ReturnType<typeof setTimeout> | null = null

		const timeout_promise = new Promise<T>((_, reject) => {
			timeout_id = setTimeout(() => {
				this.writeLog('task_timeout', { task_type })
				reject(new Error(`${task_type} timeout`))
			}, this.task_timeout_ms)
		})

		try {
			return await Promise.race([task_promise, timeout_promise])
		} finally {
			if (timeout_id) clearTimeout(timeout_id)
		}
	}

	private writeLog(event_name: string, payload?: Record<string, unknown>) {
		if (payload) {
			console.log('[memory-ui]', event_name, payload)
			return
		}

		console.log('[memory-ui]', event_name)
	}

	off() {}
}
