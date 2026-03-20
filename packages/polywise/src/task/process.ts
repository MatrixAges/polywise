import { task } from '@core/db/schema'
import { env } from '@core/env'
import { log } from '@core/utils'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import { emitter } from '.'
import handleTriple from './handleTriple'

import type { Task } from '.'

const handlers: Record<string, (args: any) => Promise<any>> = {
	triple: handleTriple
}

export default async (item: Task) => {
	const [err] = await to(env.db.update(task).set({ status: 'running' }).where(eq(task.id, item.id)))

	if (err) {
		log('TASK_QUEUE', 'updateStatusError', () => `${item.id}: ${err}`)

		return
	}

	emitter.emit('change')

	const handler = handlers[item.type]

	try {
		log('TASK_QUEUE', 'startTask', () => `${item.id}`)

		await handler(item.args)
		await env.db.update(task).set({ status: 'success' }).where(eq(task.id, item.id))

		emitter.emit('change')
	} catch (e) {
		log('TASK_QUEUE', 'taskError', () => `${item.id}: ${e}`)

		const [err2] = await to(env.db.update(task).set({ status: 'fail' }).where(eq(task.id, item.id)))

		if (err2) log('TASK_QUEUE', 'updateStatusError', () => `${item.id}: ${err2}`)

		emitter.emit('change')
	}
}
