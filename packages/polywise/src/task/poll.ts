import { task } from '@core/db/schema'
import { env } from '@core/env'
import { log } from '@core/utils'
import { to } from 'await-to-js'
import { and, eq } from 'drizzle-orm'

import { queue } from '.'
import schedulePoll from './schedulePoll'

const MIN = 300
const MAX = 30000

const concurrent: Record<string, number> = {
	url: 3,
	triple: 1
}

export default async (type: string) => {
	if (!queue.on) return

	const q = queue.map.get(type)

	if (!q) return

	const slots = (concurrent[type] ?? 1) - q.running()

	if (slots <= 0) {
		schedulePoll(type, MIN)

		return
	}

	const [err, pending] = await to(
		env.db
			.select()
			.from(task)
			.where(and(eq(task.type, type), eq(task.status, 'pending')))
			.limit(slots)
	)

	if (err) {
		log('TASK_QUEUE', 'pollError', () => `${type}: ${err}`)

		schedulePoll(type, MIN)

		return
	}

	if (!pending || pending.length === 0) {
		const tick = queue.ticks.get(type) ?? MIN
		const next = Math.min(tick * 2, MAX)

		queue.ticks.set(type, next)

		schedulePoll(type, next)

		return
	}

	queue.ticks.set(type, MIN)

	for (const item of pending) {
		q.push(item)
	}

	schedulePoll(type, MIN)
}
