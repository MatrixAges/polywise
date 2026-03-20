import { on } from 'events'
import { task } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { emitter } from '../task'
import { p } from '../utils/trpc'

const input_type = object({
	type: string().optional()
})

const getTasks = async (type?: string) => {
	if (type) return env.db.select().from(task).where(eq(task.type, type))

	return env.db.select().from(task)
}

export default p.input(input_type).subscription(async function* (args) {
	const { signal, input } = args

	yield await getTasks(input.type)

	try {
		for await (const _ of on(emitter, 'change', { signal })) {
			yield await getTasks(input.type)
		}
	} finally {
	}
})
