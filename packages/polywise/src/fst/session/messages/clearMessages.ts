import { message } from '@core/db/schema'
import { removeMessages } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type { Context } from '../../types'
import type Index from '../index'

export default async (s: Index) => {
	s.model_messages = []
	s.ui_messages = []
	s.ui_messages = []
	s.ui_has_older = false
	s.ui_has_newer = false
	s.archived_at = null
	s.context = {} as Context

	await s.setRunning(false)
	await s.setContext({})
	await s.setState()

	await removeMessages(eq(message.session_id, s.id))

	await s.clearTasks()
	await s.clearPlan()

	s.sync()
}
