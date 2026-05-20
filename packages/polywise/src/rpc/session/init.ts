import events from 'events'
import { connectSession, GroupStore, p, SessionEventStore, SessionStore } from '@core/utils'
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
	let session = SessionStore.get(id)

	if (session) {
		yield session.getData()
	} else {
		if (!input.global) id = getId()

		session = await connectSession({ id })
		const res = await session.getData()

		yield res
	}

	const stop = () => session.abortStream()
	const clear = () => session.clearMessages()
	const removeMessage = (message_id: string) => session.removeMessage(message_id)
	const archive = () => session.archiveMessages()
	const unarchive = () => session.unarchiveMessages()
	const load = (type: 'prev' | 'next') => session.loadMessages(type)

	const setConfig = async (patch: {
		mode?: string
		audit_mode?: 'limited' | 'auto' | 'full'
		disable_map?: Array<string>
		enable_sub_agent?: boolean
		sub_agent_keys?: Array<string>
		enable_agent_tool?: boolean
		agent_ids?: Array<string>
	}) => {
		await session.setConfig({
			...(patch.mode ? { mode: patch.mode as 'normal' | 'plan' | 'plan-exec' } : {}),
			...(patch.audit_mode ? { audit_mode: patch.audit_mode } : {}),
			...(patch.disable_map ? { disable_map: patch.disable_map } : {}),
			...(typeof patch.enable_sub_agent === 'boolean' ? { enable_sub_agent: patch.enable_sub_agent } : {}),
			...(patch.sub_agent_keys ? { sub_agent_keys: patch.sub_agent_keys as any } : {}),
			...(typeof patch.enable_agent_tool === 'boolean'
				? { enable_agent_tool: patch.enable_agent_tool }
				: {}),
			...(patch.agent_ids ? { agent_ids: patch.agent_ids } : {})
		})
		const data = await session.getData()

		SessionEventStore.emit(`${id}/change`, data)
	}

	const destroy = () => {
		session.abortStream()

		SessionStore.delete(id)
		GroupStore.delete(id)

		SessionEventStore.removeAllListeners(`${id}/change`)
		SessionEventStore.removeAllListeners(`${id}/stop`)
		SessionEventStore.removeAllListeners(`${id}/clear`)
		SessionEventStore.removeAllListeners(`${id}/removeMessage`)
		SessionEventStore.removeAllListeners(`${id}/archive`)
		SessionEventStore.removeAllListeners(`${id}/unarchive`)
		SessionEventStore.removeAllListeners(`${id}/load`)
		SessionEventStore.removeAllListeners(`${id}/destroy`)
		SessionEventStore.removeAllListeners(`${id}/answer`)
	}

	SessionEventStore.on(`${id}/stop`, stop)
	SessionEventStore.on(`${id}/clear`, clear)
	SessionEventStore.on(`${id}/removeMessage`, removeMessage)
	SessionEventStore.on(`${id}/archive`, archive)
	SessionEventStore.on(`${id}/unarchive`, unarchive)
	SessionEventStore.on(`${id}/load`, load)
	SessionEventStore.on(`${id}/setConfig`, setConfig)
	SessionEventStore.on(`${id}/destroy`, destroy)

	try {
		for await (const [data] of events.on(SessionEventStore, `${id}/change`, { signal })) {
			yield data as ChatEventRes
		}
	} finally {
		SessionEventStore.off(`${id}/stop`, stop)
		SessionEventStore.off(`${id}/clear`, clear)
		SessionEventStore.off(`${id}/removeMessage`, removeMessage)
		SessionEventStore.off(`${id}/archive`, archive)
		SessionEventStore.off(`${id}/unarchive`, unarchive)
		SessionEventStore.off(`${id}/load`, load)
		SessionEventStore.off(`${id}/setConfig`, setConfig)
		SessionEventStore.off(`${id}/destroy`, destroy)
	}
})
