import { Session } from '@core/fst'

import { SessionEventStore, SessionStore } from './session'

interface ConnectSessionArgs {
	id: string
	is_cron?: boolean
}

export default async (args: ConnectSessionArgs) => {
	const { id, is_cron } = args

	let session = SessionStore.get(id)!

	if (!session) {
		session = new Session()

		await session.init({ id, event: SessionEventStore, is_cron })

		SessionStore.set(id, session)
	}

	return session
}
