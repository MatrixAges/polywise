import { task } from '@core/db/schema'
import { setTask } from '@core/db/services'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import { emitter, queue } from '.'

import type { Task } from '.'

export default async (item: Task) => {
	const [err] = await to(setTask(eq(task.id, item.id), { status: 'pending' }))

	if (err) throw new Error(`Failed to retry task: ${err.message}`)

	const q = queue.map.get(item.type)

	if (q) {
		const updated = { ...item, status: 'pending' as const }

		q.unshift(updated)
	}

	emitter.emit('change')
}
