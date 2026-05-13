import { group_session } from '@core/db/schema'
import { getSessionGroup } from '@core/db/services'
import { Group, Session } from '@core/fst'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'

import { GroupStore, SessionEventStore, SessionStore } from './session'

export interface ConnectSessionArgs {
	id: string
	is_cron?: boolean
	title?: string
}

export default async (args: ConnectSessionArgs) => {
	const { id, is_cron, title } = args

	let session = SessionStore.get(id)!
	console.log('[group-debug][connectSession] lookup', {
		session_id: id,
		has_cached_session: Boolean(session)
	})

	if (!session) {
		const linked_group = await getSessionGroup(eq(group_session.session_id, id))
		console.log('[group-debug][connectSession] linked-group', {
			session_id: id,
			group_id: linked_group?.group.id ?? null
		})

		session = linked_group ? new Group() : new Session()
		console.log('[group-debug][connectSession] init-start', {
			session_id: id,
			session_type: session.constructor.name
		})

		await session.init({
			id,
			event: SessionEventStore,
			is_cron,
			title: title || `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
			...(linked_group ? { group_id: linked_group.group.id } : {})
		})
		console.log('[group-debug][connectSession] init-done', {
			session_id: id,
			session_type: session.constructor.name
		})

		SessionStore.set(id, session)

		if (session instanceof Group) {
			GroupStore.set(id, session)
		}
	}

	console.log('[group-debug][connectSession] return', {
		session_id: id,
		session_type: session.constructor.name
	})

	return session
}
