import path from 'path'
import { app } from '@core/consts'
import { agent_session, project_session, session } from '@core/db/schema'
import { SessionEventStore, SessionStore, SessionStreamStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import { getSession, removeSession } from '../../../db/services'
import { removeAgentSession } from '../../../db/services/externals/agent_session'
import { removeProjectSession } from '../../../db/services/externals/project_session'
import readPinList from './readPinList'
import writePinList from './writePinList'

const removeSessionById = async (session_id: string) => {
	const target_session = await getSession(eq(session.id, session_id))

	if (!target_session) {
		return null
	}

	await SessionStreamStore.unsubscribe(session_id)

	const target_live_session = SessionStore.get(session_id)

	if (target_live_session) {
		await target_live_session.abortStream()

		SessionEventStore.emit(`${session_id}/destroy`)

		SessionEventStore.removeAllListeners(`${session_id}/change`)
		SessionEventStore.removeAllListeners(`${session_id}/stop`)
		SessionEventStore.removeAllListeners(`${session_id}/clear`)
		SessionEventStore.removeAllListeners(`${session_id}/archive`)
		SessionEventStore.removeAllListeners(`${session_id}/unarchive`)
		SessionEventStore.removeAllListeners(`${session_id}/load`)
		SessionEventStore.removeAllListeners(`${session_id}/destroy`)
		SessionEventStore.removeAllListeners(`${session_id}/answer`)

		SessionStore.delete(session_id)
	}

	const pin_list = await readPinList()
	const next_pin_list = pin_list.filter(item => item.id !== session_id)

	await removeProjectSession(eq(project_session.session_id, session_id))
	await removeAgentSession(eq(agent_session.session_id, session_id))

	await writePinList(next_pin_list)

	const removed_session = await removeSession(eq(session.id, session_id))
	const session_dir = path.resolve(app.app_path, 'sessions', session_id)

	await fs.remove(session_dir)

	return removed_session
}

export default removeSessionById
