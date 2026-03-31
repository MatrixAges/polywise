import { message } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type { Context } from '../../types'
import type Index from '../index'

export default async (s: Index) => {
	s.model_messages = []
	s.ui_messages = []
	s.ui_has_older = false
	s.ui_has_newer = false
	s.context = {} as Context

	await s.setContext({})

	await env.db.delete(message).where(eq(message.session_id, s.id))
}
