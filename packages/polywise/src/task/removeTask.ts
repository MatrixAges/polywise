import { task } from '@core/db/schema'
import { removeTask } from '@core/db/services'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import { emitter, queue } from '.'

export default async (id: string) => {
	for (const [, q] of queue.map) {
		const items = q.getQueue()
		const idx = items.findIndex(t => t.id === id)

		if (idx !== -1) {
			items.splice(idx, 1)

			break
		}
	}

	const [err] = await to(removeTask(eq(task.id, id)))

	if (err) throw new Error(`Failed to remove task: ${err.message}`)

	emitter.emit('change')
}
