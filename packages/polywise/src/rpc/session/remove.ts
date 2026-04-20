import path from 'path'
import { app } from '@core/consts'
import { session } from '@core/db/schema'
import { p, SessionEventStore, SessionStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { getSession, removeSession } from '../../db/services'
import { readGroupList, readPinList, writeGroupList, writePinList } from './utils'

const input_type = object({ id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const target_session = await getSession(eq(session.id, input.id))

	if (!target_session) {
		return null
	}

	if (SessionStore.get(input.id)) {
		SessionEventStore.emit(`${input.id}/destroy`)
	}

	const pin_list = await readPinList()
	const group_list = await readGroupList()
	const next_pin_list = pin_list.filter(item => item.id !== input.id)
	const next_group_list = group_list.map(item => ({
		...item,
		items: item.items.filter(session_id => session_id !== input.id)
	}))

	await writePinList(next_pin_list)
	await writeGroupList(next_group_list)

	const removed_session = await removeSession(eq(session.id, input.id))
	const session_dir = path.resolve(app.app_path, 'sessions', input.id)

	await fs.remove(session_dir)

	return removed_session
})
