import { makeAutoObservable, runInAction } from 'mobx'
import { local } from 'stk/storage'
import { injectable } from 'tsyringe'
import { v4 as uuid } from 'uuid'

import { Util } from '@/models/common'
import { ipc } from '@/utils'

export interface ITask {
	id: string
	type: 'save' | 'update'
	args: any
	status: 'pending' | 'processing' | 'completed' | 'failed'
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
		this.tasks = local.memory_tasks || []

		this.processQueue()
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
			if (task.type === 'save') {
				await ipc.memory.save.mutate(task.args)
			} else if (task.type === 'update') {
				await ipc.memory.update.mutate(task.args)
			}

			runInAction(() => {
				task.status = 'completed'
				this.saveTasks()
			})
		} catch (error: any) {
			runInAction(() => {
				task.status = 'failed'
				task.error = error.message
				this.saveTasks()
			})
		} finally {
			this.is_processing = false

			setTimeout(this.processQueue, 1000)
		}
	}

	saveTasks() {
		local.memory_tasks = this.tasks.filter(t => t.status !== 'completed')
	}

	addTask(type: ITask['type'], args: any) {
		const task: ITask = {
			id: uuid(),
			type,
			args,
			status: 'pending',
			created_at: Date.now()
		}

		this.tasks.push(task)
		this.saveTasks()
		this.processQueue()
	}

	async query(args: { query: string; idol_id?: string; root_ids?: Array<string>; metrics_ids?: Array<string> }) {
		return await ipc.memory.query.query(args)
	}

	async forget(args: {
		memory_id?: string
		query?: string
		idol_id?: string
		root_ids?: Array<string>
		metrics_ids?: Array<string>
	}) {
		return await ipc.memory.forget.mutate(args)
	}

	off() {}
}
