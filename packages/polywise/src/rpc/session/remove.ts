import path from 'path'
import { app } from '@core/consts'
import { project_session, session } from '@core/db/schema'
import { p, SessionEventStore, SessionStore, SessionStreamStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { getSession, removeSession } from '../../db/services'
import { removeProjectSession } from '../../db/services/externals/project_session'
import { readGroupList, readPinList, writeGroupList, writePinList } from './utils'

const input_type = object({ id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const target_session = await getSession(eq(session.id, input.id))

	if (!target_session) {
		return null
	}

	await SessionStreamStore.unsubscribe(input.id)

	const target_live_session = SessionStore.get(input.id)

	if (target_live_session) {
		await target_live_session.abortStream()

		SessionEventStore.emit(`${input.id}/destroy`)

		SessionEventStore.removeAllListeners(`${input.id}/change`)
		SessionEventStore.removeAllListeners(`${input.id}/stop`)
		SessionEventStore.removeAllListeners(`${input.id}/clear`)
		SessionEventStore.removeAllListeners(`${input.id}/archive`)
		SessionEventStore.removeAllListeners(`${input.id}/unarchive`)
		SessionEventStore.removeAllListeners(`${input.id}/load`)
		SessionEventStore.removeAllListeners(`${input.id}/destroy`)
		SessionEventStore.removeAllListeners(`${input.id}/answer`)

		SessionStore.delete(input.id)
	}

	const pin_list = await readPinList()
	const group_list = await readGroupList()
	const next_pin_list = pin_list.filter(item => item.id !== input.id)
	const next_group_list = group_list.map(item => ({
		...item,
		items: item.items.filter(session_id => session_id !== input.id)
	}))

	await removeProjectSession(eq(project_session.session_id, input.id))

	await writePinList(next_pin_list)
	await writeGroupList(next_group_list)

	const removed_session = await removeSession(eq(session.id, input.id))
	const session_dir = path.resolve(app.app_path, 'sessions', input.id)

	await fs.remove(session_dir)

	return removed_session
})
