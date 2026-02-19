import { makeAutoObservable, runInAction, toJS } from 'mobx'
import { local } from 'stk/storage'
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
				metrics_ids?: Array<string>
				metadata?: Record<string, unknown>
		  }
	status: 'pending' | 'processing' | 'failed'
	error?: string
	created_at: number
}

@injectable()
export default class MemoryModel {
	tasks = [] as Array<ITask>
	is_processing = false

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	init() {
		this.tasks = this.readTasksFromStorage()

		void this.processQueue()
	}

	async processQueue() {
		if (this.is_processing) return

		const task = this.tasks.find(t => t.status === 'pending')

		if (!task) return

		this.is_processing = true

		runInAction(() => {
			task.status = 'processing'
		})

		try {
			const task_args = this.toSerializableTaskArgs(task.args)

			if (task.type === 'save') {
				await ipc.memory.save.mutate(
					task_args as {
						content: string
						idol_id?: string
						root_ids?: Array<string>
						metrics_ids?: Array<string>
						metadata?: Record<string, unknown>
					}
				)
			} else if (task.type === 'update') {
				await ipc.memory.update.mutate(
					task_args as {
						memory_id: string
						content: string
						idol_id?: string
						root_ids?: Array<string>
						metrics_ids?: Array<string>
						metadata?: Record<string, unknown>
					}
				)
			}

			runInAction(() => {
				this.tasks = this.tasks.filter(item => item.id !== task.id)
				this.saveTasks()
			})
		} catch (error: unknown) {
			runInAction(() => {
				task.status = 'failed'
				task.error = error instanceof Error ? error.message : String(error)
				this.saveTasks()
			})
		} finally {
			this.is_processing = false

			setTimeout(this.processQueue, 1000)
		}
	}

	saveTasks() {
		try {
			local.memory_tasks = this.toSerializableTasks(this.tasks)
		} catch {
			local.memory_tasks = []
		}
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
		return await ipc.memory.query.query(toJS(args))
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

	private readTasksFromStorage() {
		const source = toJS(local.memory_tasks)

		if (!Array.isArray(source)) return []

		return source.filter(item => item && typeof item === 'object') as Array<ITask>
	}

	private toSerializableTaskArgs(args: ITask['args']) {
		const plain_args = toJS(args)

		return JSON.parse(JSON.stringify(plain_args)) as ITask['args']
	}

	private toSerializableTasks(tasks: Array<ITask>) {
		const plain_tasks = toJS(tasks)

		return JSON.parse(JSON.stringify(plain_tasks)) as Array<ITask>
	}

	off() {}
}
