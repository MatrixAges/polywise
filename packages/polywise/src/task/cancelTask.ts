import { task } from '@core/db/schema'
import { setTask } from '@core/db/services'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import { emitter, queue } from '.'

export default async (id: string) => {
	const [err] = await to(setTask(eq(task.id, id), { status: 'cancel' }))

	if (err) throw new Error(`Failed to cancel task: ${err.message}`)

	for (const [, q] of queue.map) {
		const items = q.getQueue()
		const idx = items.findIndex(t => t.id === id)

		if (idx !== -1) {
			items.splice(idx, 1)

			break
		}
	}

	emitter.emit('change')
}
