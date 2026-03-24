import { on } from 'events'
import { Session } from '@core/fst'
import { p, SessionEventStore, SessionStore } from '@core/utils'
import { string } from 'zod'

import type { ChatEventRes } from '@core/fst'

export default p.input(string()).subscription(async function* (args) {
	const { signal, input: id } = args

	let session = SessionStore.get(id) as Session

	if (session) {
		yield session.getData()
	} else {
		session = new Session()

		const res = await session.init({ id, event: SessionEventStore })

		SessionStore.set(id, session)

		yield res
	}

	const stop = () => session.abort()
	const destroy = () => SessionStore.delete(id)

	SessionEventStore.on(`${id}/STOP`, stop)
	SessionEventStore.on(`${id}/DESTROY`, destroy)

	try {
		for await (const [data] of on(SessionEventStore, `${id}/CHANGE`, { signal })) {
			yield data as ChatEventRes
		}
	} finally {
		SessionEventStore.removeAllListeners()
	}
})
