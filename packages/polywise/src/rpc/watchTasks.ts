import { on } from 'events'
import { task } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { task_emitter } from '../task'
import { p } from '../utils/trpc'

const input_type = object({
	type: string().optional()
})

const get_tasks = async (type?: string) => {
	if (type) return env.db.select().from(task).where(eq(task.type, type))

	return env.db.select().from(task)
}

export default p.input(input_type).subscription(async function* (args) {
	const { signal, input } = args

	yield await get_tasks(input.type)

	try {
		for await (const _ of on(task_emitter, 'change', { signal })) {
			yield await get_tasks(input.type)
		}
	} finally {
	}
})
