import { on } from 'events'
import { Session } from '@core/fst'
import { p, SessionEventStore, SessionStore } from '@core/utils'
import { getId } from 'stk/utils'
import { boolean, object, string } from 'zod'

import type { ChatEventRes } from '@core/fst'

const input_type = object({
	id: string(),
	global: boolean().optional()
})

export default p.input(input_type).subscription(async function* (args) {
	const { signal, input } = args

	let id = input.id
	let session = SessionStore.get(id) as Session

	if (session) {
		yield session.getData()
	} else {
		session = new Session()

		if (!input.global) id = getId()

		const res = await session.init({ id, event: SessionEventStore })

		SessionStore.set(id, session)

		yield res
	}

	const stop = () => session.abort()
	const clear = () => session.clear()
	const load = (type: 'prev' | 'next') => session.loadMessages(type)
	const destroy = () => SessionStore.delete(id)

	SessionEventStore.on(`${id}/stop`, stop)
	SessionEventStore.on(`${id}/clear`, clear)
	SessionEventStore.on(`${id}/load`, load)
	SessionEventStore.on(`${id}/destroy`, destroy)

	try {
		for await (const [data] of on(SessionEventStore, `${id}/change`, { signal })) {
			yield data as ChatEventRes
		}
	} finally {
		SessionEventStore.off(`${id}/stop`, stop)
		SessionEventStore.off(`${id}/clear`, clear)
		SessionEventStore.off(`${id}/load`, load)
		SessionEventStore.off(`${id}/destroy`, destroy)
	}
})
