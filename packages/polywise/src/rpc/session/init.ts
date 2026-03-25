import { on } from 'events'
import { Session } from '@core/fst'
import { p, SessionEventStore, SessionStore } from '@core/utils'
import { getId } from 'stk/utils'
import { string } from 'zod'

import type { ChatEventRes } from '@core/fst'

export default p.input(string()).subscription(async function* (args) {
	const { signal, input } = args

	let id = input
	let session = SessionStore.get(input) as Session

	if (session) {
		yield session.getData()
	} else {
		session = new Session()

		id = getId()

		const res = await session.init({ id, event: SessionEventStore })

		SessionStore.set(id, session)

		yield res
	}

	const stop = () => session.abort()
	const destroy = () => SessionStore.delete(id)

	SessionEventStore.on(`${id}/stop`, stop)
	SessionEventStore.on(`${id}/destroy`, destroy)

	try {
		for await (const [data] of on(SessionEventStore, `${id}/change`, { signal })) {
			yield data as ChatEventRes
		}
	} finally {
		SessionEventStore.off(`${id}/stop`, stop)
		SessionEventStore.off(`${id}/destroy`, destroy)
	}
})
