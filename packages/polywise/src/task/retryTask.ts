import { task } from '@core/db/schema'
import { env } from '@core/env'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import { emitter, queue } from '.'

import type { Task } from './types'

export default async (item: Task) => {
	const [err] = await to(env.db.update(task).set({ status: 'pending' }).where(eq(task.id, item.id)))

	if (err) throw new Error(`Failed to retry task: ${err.message}`)

	const q = queue.map.get(item.type)

	if (q) {
		const updated = { ...item, status: 'pending' as const }

		q.unshift(updated)
	}

	emitter.emit('change')
}
