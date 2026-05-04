import path from 'path'
import { session } from '@core/db/schema'
import { p, SessionStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { app } from '../../consts'
import { setSession } from '../../db/services'
import { session_status_emitter } from './watchSessionStatus'

const input_type = object({ id: string(), title: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const title_context = {
		session_auto_title: input.title,
		session_title_source: 'human' as const
	}
	const target_live_session = SessionStore.get(input.id)

	if (target_live_session) {
		const next_session = await target_live_session.updateSession({ title: input.title })

		target_live_session.session = next_session || {
			...target_live_session.session,
			title: input.title
		}

		await target_live_session.setContext(title_context)

		session_status_emitter.emit('change', {
			[input.id]: {
				title: target_live_session.session.title,
				running: target_live_session.session.is_runing,
				unread: target_live_session.session.unread ?? false,
				running_since: target_live_session.running_since
			}
		})

		target_live_session.sync()

		return target_live_session.session
	}

	const next_session = await setSession(eq(session.id, input.id), { title: input.title })

	if (!next_session) {
		return null
	}

	const session_dir = path.resolve(app.app_path, 'sessions', input.id)
	const context_path = path.resolve(session_dir, 'context.json')

	await fs.ensureDir(session_dir)

	let current_context = null as unknown
	const has_context = await fs.pathExists(context_path)

	if (has_context) {
		current_context = await fs.readJson(context_path)
	}

	const next_context = {
		...(current_context && typeof current_context === 'object' ? current_context : {}),
		...title_context
	}

	await fs.writeJson(context_path, next_context, { spaces: 4 })

	session_status_emitter.emit('change', {
		[input.id]: {
			title: next_session.title,
			running: next_session.is_runing,
			unread: next_session.unread ?? false,
			running_since: null
		}
	})

	return next_session
})
