import { EventEmitter } from 'events'
import { task } from '@core/db/schema'
import { env } from '@core/env'
import { log } from '@core/utils'
import { to } from 'await-to-js'
import { and, eq } from 'drizzle-orm'
import fastq from 'fastq'

import handleTriple from './handleTriple'

import type { queueAsPromised } from 'fastq'
import type { Task } from './types'

export const task_emitter = new EventEmitter()

const MIN_POLL_INTERVAL = 300
const MAX_POLL_INTERVAL = 30000

const concurrent: Record<string, number> = {
	url: 3,
	triple: 1
}

const handlers: Record<string, (args: any) => Promise<any>> = {
	triple: handleTriple
}

export default class TaskQueue {
	private queues: Map<string, queueAsPromised<Task>> = new Map()
	private poll_intervals: Map<string, NodeJS.Timeout | null> = new Map()
	private current_intervals: Map<string, number> = new Map()
	private is_started: boolean = false

	async start() {
		if (this.is_started) return

		this.is_started = true

		for (const type of Object.keys(handlers)) {
			const concurrency = concurrent[type] ?? 1
			const queue = fastq.promise(this, this.processTask, concurrency)

			queue.error(this.handleError)

			this.queues.set(type, queue)
			this.current_intervals.set(type, MIN_POLL_INTERVAL)

			this.poll(type)
		}

		log('TASK_QUEUE', 'start', () => `started ${this.queues.size} queues`)
	}

	private async poll(type: string) {
		if (!this.is_started) return

		const queue = this.queues.get(type)

		if (!queue) return

		const concurrency = concurrent[type] ?? 1
		const available_slots = concurrency - queue.running()

		if (available_slots <= 0) {
			this.schedulePoll(type, MIN_POLL_INTERVAL)

			return
		}

		const [err, pending_tasks] = await to(
			env.db
				.select()
				.from(task)
				.where(and(eq(task.type, type), eq(task.status, 'pending')))
				.limit(available_slots)
		)

		if (err) {
			log('TASK_QUEUE', 'pollError', () => `${type}: ${err}`)

			this.schedulePoll(type, MIN_POLL_INTERVAL)

			return
		}

		if (!pending_tasks || pending_tasks.length === 0) {
			const current_interval = this.current_intervals.get(type) ?? MIN_POLL_INTERVAL
			const new_interval = Math.min(current_interval * 2, MAX_POLL_INTERVAL)

			this.current_intervals.set(type, new_interval)
			this.schedulePoll(type, new_interval)

			return
		}

		this.current_intervals.set(type, MIN_POLL_INTERVAL)

		for (const task_item of pending_tasks) {
			queue.push(task_item)
		}

		this.schedulePoll(type, MIN_POLL_INTERVAL)
	}

	private schedulePoll(type: string, interval: number) {
		const existing_interval = this.poll_intervals.get(type)

		if (existing_interval) clearTimeout(existing_interval)

		const new_interval = setTimeout(() => this.poll(type), interval)

		this.poll_intervals.set(type, new_interval)
	}

	private async processTask(task_item: Task) {
		const [err_update] = await to(
			env.db.update(task).set({ status: 'running' }).where(eq(task.id, task_item.id))
		)

		if (err_update) {
			log('TASK_QUEUE', 'updateStatusError', () => `${task_item.id}: ${err_update}`)

			return
		}

		task_emitter.emit('change')

		const handler = handlers[task_item.type]

		if (!handler) {
			log('TASK_QUEUE', 'noHandler', () => `${task_item.id}: no handler for type ${task_item.type}`)

			await env.db.update(task).set({ status: 'fail' }).where(eq(task.id, task_item.id))
			task_emitter.emit('change')

			return
		}

		try {
			log('TASK_QUEUE', 'startTask', () => `${task_item.id}`)

			await handler(task_item.args)
			await env.db.update(task).set({ status: 'success' }).where(eq(task.id, task_item.id))
			task_emitter.emit('change')
		} catch (error) {
			log('TASK_QUEUE', 'taskError', () => `${task_item.id}: ${error}`)

			const [err] = await to(env.db.update(task).set({ status: 'fail' }).where(eq(task.id, task_item.id)))

			if (err) log('TASK_QUEUE', 'updateStatusError', () => `${task_item.id}: ${err}`)

			task_emitter.emit('change')
		}
	}

	private handleError(error: unknown, task_item: Task) {
		log('TASK_QUEUE', 'queueError', () => `${task_item.id}: ${error}`)
	}

	async cancelTask(id: string) {
		const [err] = await to(env.db.update(task).set({ status: 'fail' }).where(eq(task.id, id)))

		if (err) throw new Error(`Failed to cancel task: ${err.message}`)

		for (const [_, queue] of this.queues) {
			const items = queue.getQueue()
			const idx = items.findIndex(t => t.id === id)

			if (idx !== -1) {
				items.splice(idx, 1)

				break
			}
		}

		task_emitter.emit('change')
	}

	async pauseTaskQueue(type: string) {
		const queue = this.queues.get(type)

		if (queue) queue.pause()

		task_emitter.emit('change')
	}

	async resumeTaskQueue(type: string) {
		const queue = this.queues.get(type)

		if (queue) queue.resume()

		task_emitter.emit('change')
	}

	async retryTask(task_item: Task) {
		const [err] = await to(env.db.update(task).set({ status: 'pending' }).where(eq(task.id, task_item.id)))

		if (err) throw new Error(`Failed to retry task: ${err.message}`)

		const queue = this.queues.get(task_item.type)

		if (queue) {
			const updated = { ...task_item, status: 'pending' as const }

			queue.unshift(updated)
		}

		task_emitter.emit('change')
	}

	async ignoreTask(id: string) {
		const [err] = await to(env.db.update(task).set({ status: 'skipped' }).where(eq(task.id, id)))

		if (err) throw new Error(`Failed to ignore task: ${err.message}`)

		task_emitter.emit('change')
	}

	async removeTask(id: string) {
		for (const [_, queue] of this.queues) {
			const items = queue.getQueue()
			const idx = items.findIndex(t => t.id === id)

			if (idx !== -1) {
				items.splice(idx, 1)

				break
			}
		}

		const [err] = await to(env.db.delete(task).where(eq(task.id, id)))

		if (err) throw new Error(`Failed to remove task: ${err.message}`)

		task_emitter.emit('change')
	}
}

let task_queue_instance: TaskQueue | null = null

export const getTaskQueue = () => task_queue_instance

export const initTask = () => {
	task_queue_instance = new TaskQueue()

	setTimeout(() => {
		task_queue_instance!.start()
	}, 6000)
}
