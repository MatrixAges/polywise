import { task } from '@core/db/schema'
import { env } from '@core/env'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'
import { boolean, object, string, enum as zenum } from 'zod'

import { getTaskQueue } from '../task'
import { p } from '../utils/trpc'

const task_action = zenum(['cancel', 'pauseQueue', 'resumeQueue', 'retry', 'ignore', 'remove'])

const input_type = object({
	id: string(),
	action: task_action
})

const output_type = object({ ok: boolean() })

export default p
	.meta({ openapi: { method: 'POST', path: '/setTask' } })
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { id, action } = input
		const task_queue = getTaskQueue()

		if (!task_queue) throw new Error('TaskQueue not initialized')

		const [err_fetch, task_rows] = await to(env.db.select().from(task).where(eq(task.id, id)).limit(1))

		if (err_fetch) throw new Error(`Failed to fetch task: ${err_fetch.message}`)

		const task_item = task_rows?.[0]

		if (!task_item) throw new Error(`Task not found: ${id}`)

		switch (action) {
			case 'cancel':
				await task_queue.cancelTask(id)

				break
			case 'pause':
				await task_queue.pauseTaskQueue(task_item.type)

				break
			case 'resume':
				await task_queue.resumeTaskQueue(task_item.type)

				break
			case 'retry':
				await task_queue.retryTask(task_item)

				break
			case 'ignore':
				await task_queue.ignoreTask(id)

				break
			case 'remove':
				await task_queue.removeTask(id)

				break
			default:
				throw new Error(`Unknown action: ${action}`)
		}

		return { ok: true }
	})
