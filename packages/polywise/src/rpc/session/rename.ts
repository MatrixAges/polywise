import path from 'path'
import { session } from '@core/db/schema'
import { p, SessionStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { app } from '../../consts'
import { getSession, setSession } from '../../db/services'

const input_type = object({ id: string(), title: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const target_session = SessionStore.get(input.id)
	const context_path = path.resolve(app.app_path, 'sessions', input.id, 'context.json')
	const current_context = await fs.readJson(context_path, { throws: false })
	const next_context = {
		...(current_context && typeof current_context === 'object' ? current_context : {}),
		session_auto_title: input.title,
		session_title_source: 'human'
	}

	if (target_session) {
		await target_session.updateSession({ title: input.title })
		await target_session.setContext({ session_auto_title: input.title, session_title_source: 'human' })

		target_session.sync()

		return target_session.session
	}

	const current_session = await getSession(eq(session.id, input.id))

	if (!current_session) {
		return null
	}

	await fs.ensureDir(path.dirname(context_path))
	await fs.writeJson(context_path, next_context, { spaces: 4 })

	return setSession(eq(session.id, input.id), { title: input.title })
})
