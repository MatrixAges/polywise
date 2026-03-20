import { task } from '@core/db/schema'
import { env } from '@core/env'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import { emitter } from '.'

export default async (id: string) => {
	const [err] = await to(env.db.update(task).set({ status: 'ignore' }).where(eq(task.id, id)))

	if (err) throw new Error(`Failed to ignore task: ${err.message}`)

	emitter.emit('change')
}
