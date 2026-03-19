import { task } from '@core/db/schema'
import { env } from '@core/env'
import { log } from '@core/utils'
import to from 'await-to-js'
import { eq } from 'drizzle-orm'
import { catchError, catchFinally } from 'stk/utils'

import handleTriple from './handleTriple'

import type { Task } from './types'

const MIN_POLL_INTERVAL = 300
const MAX_POLL_INTERVAL = 30000

const concurrent = {
	url: 3,
	triple: 1
}

const handlers = {
	triple: handleTriple
}

export default class TaskQueue {
	private readonly tasks: Map<string, Set<string>> = new Map()
	private readonly poll_intervals: Map<string, NodeJS.Timeout | null> = new Map()
	private readonly current_intervals: Map<string, number> = new Map()
	private is_started: boolean = false

	async start() {
		if (this.is_started) return

		this.is_started = true

		for (const [type] of this.config) {
			this.tasks.set(type, new Set())
			this.current_intervals.set(type, MIN_POLL_INTERVAL)

			this.poll(type)
		}

		log('TASK_QUEUE', 'start', () => `started ${this.config.size} config`)
	}

	@catchError(function (error, ctx, type) {
		log('TASK_QUEUE', 'pollError', () => `${type}: ${error}`)

		const interval = setTimeout(() => ctx.poll(type), MIN_POLL_INTERVAL)

		ctx.poll_intervals.set(type, interval)
	})
	private async poll(type: string) {
		if (!this.is_started) return

		const config = this.config.get(type)!
		const running = this.tasks.get(type)

		if (!running) return

		if (running.size >= config.concurrency) {
			const interval = setTimeout(() => this.poll(type), MIN_POLL_INTERVAL)
			this.poll_intervals.set(type, interval)
			return
		}

		const available_slots = config.concurrency - running.size
		const pending_tasks = await env.db.select().from(task).where(eq(task.type, type)).limit(available_slots)

		if (pending_tasks.length === 0) {
			const current_interval = this.current_intervals.get(type) ?? MIN_POLL_INTERVAL
			const new_interval = Math.min(current_interval * 2, MAX_POLL_INTERVAL)

			this.current_intervals.set(type, new_interval)

			const interval = setTimeout(() => this.poll(type), new_interval)

			this.poll_intervals.set(type, interval)

			return
		}

		this.current_intervals.set(type, MIN_POLL_INTERVAL)

		for (const task_item of pending_tasks) {
			if (running.size >= config.concurrency) break

			running.add(task_item.id)

			this.startTask(type, task_item)
		}

		const interval = setTimeout(() => this.poll(type), MIN_POLL_INTERVAL)

		this.poll_intervals.set(type, interval)
	}

	@catchFinally(function (ctx, type, task_item) {
		ctx.tasks.get(type)?.delete(task_item.id)
		ctx.poll(type)
	})
	private async startTask(type: string, task_item: Task) {
		const config = this.config.get(type)!
		const handler = handlers[type]

		const [err_update] = await to(
			env.db.update(task).set({ status: 'running' }).where(eq(task.id, task_item.id))
		)

		if (err_update) return log('TASK_QUEUE', 'updateStatusError', () => `${task_item.id}: ${err_update}`)

		try {
			log('TASK_QUEUE', 'startTask', () => `${task_item.id}`)

			await handler(task_item.args)
			await env.db.update(task).set({ status: 'success' }).where(eq(task.id, task_item.id))
		} catch (error) {
			log('TASK_QUEUE', 'taskError', () => `${task_item.id}: ${error}`)

			const [err] = await to(env.db.update(task).set({ status: 'fail' }).where(eq(task.id, task_item.id)))

			if (err) log('TASK_QUEUE', 'updateStatusError', () => `${task_item.id}: ${err}`)
		}
	}
}
