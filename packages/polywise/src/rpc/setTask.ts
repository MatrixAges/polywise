import { task } from '@core/db/schema'
import { getTask } from '@core/db/services'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'
import { boolean, enum as Enum, object, string } from 'zod'

import { cancelTask, ignoreTask, pauseQueue, removeTask, resumeQueue, retryTask } from '../task'
import { p } from '../utils/trpc'

const input_type = object({
	id: string(),
	action: Enum(['cancel', 'pauseQueue', 'resumeQueue', 'retry', 'ignore', 'remove'])
})

const output_type = object({ ok: boolean() })

export default p
	.meta({ openapi: { method: 'POST', path: '/setTask' } })
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { id, action } = input

		const [err_fetch, task_item] = await to(getTask(eq(task.id, id)))

		if (err_fetch) throw new Error(`Failed to fetch task: ${err_fetch.message}`)

		if (!task_item) throw new Error(`Task not found: ${id}`)

		switch (action) {
			case 'pauseQueue':
				pauseQueue(task_item.type)

				break
			case 'resumeQueue':
				resumeQueue(task_item.type)

				break
			case 'cancel':
				await cancelTask(id)

				break

			case 'retry':
				await retryTask(task_item)

				break
			case 'ignore':
				await ignoreTask(id)

				break
			case 'remove':
				await removeTask(id)

				break
		}

		return { ok: true }
	})
