import { global_linkcase_session_id, global_linkcase_session_title } from '@core/consts'
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

	if (!session) {
		const linked_group = await getSessionGroup(eq(group_session.session_id, id))

		session = linked_group ? new Group() : new Session()

		await session.init({
			id,
			event: SessionEventStore,
			is_cron,
			title:
				title ||
				(id === global_linkcase_session_id
					? global_linkcase_session_title
					: `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`),
			...(linked_group ? { group_id: linked_group.group.id } : {})
		})

		SessionStore.set(id, session)

		if (session instanceof Group) {
			GroupStore.set(id, session)
		}
	}

	return session
}
