import { task } from '@core/db/schema'
import { setTask } from '@core/db/services'
import { to } from 'await-to-js'
import { eq } from 'drizzle-orm'

import { emitter } from '.'

export default async (id: string) => {
	const [err] = await to(setTask(eq(task.id, id), { status: 'ignore' }))

	if (err) throw new Error(`Failed to ignore task: ${err.message}`)

	emitter.emit('change')
}
