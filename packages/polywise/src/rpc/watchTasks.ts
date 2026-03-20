import { on } from 'events'
import { task } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { emitter, queue } from '../task'
import { p } from '../utils/trpc'

const input_type = object({
	type: string().optional()
})

const getPayload = async (type?: string) => {
	const tasks = type
		? await env.db.select().from(task).where(eq(task.type, type))
		: await env.db.select().from(task)

	const queue_item = type ? queue.map.get(type) : null
	const paused = queue_item?.paused ?? false

	return { tasks, paused }
}

export default p.input(input_type).subscription(async function* (args) {
	const { signal, input } = args

	yield await getPayload(input.type)

	for await (const _ of on(emitter, 'change', { signal })) {
		yield await getPayload(input.type)
	}
})
