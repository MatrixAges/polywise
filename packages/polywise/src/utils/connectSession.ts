import { Session } from '@core/fst'
import dayjs from 'dayjs'

import { SessionEventStore, SessionStore } from './session'

export interface ConnectSessionArgs {
	id: string
	is_cron?: boolean
	title?: string
}

export default async (args: ConnectSessionArgs) => {
	const { id, is_cron, title } = args

	let session = SessionStore.get(id)!

	if (!session) {
		session = new Session()

		await session.init({
			id,
			event: SessionEventStore,
			is_cron,
			title: title || `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
		})

		SessionStore.set(id, session)
	}

	return session
}
