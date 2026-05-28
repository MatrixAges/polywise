import { global_linkcase_session_id, global_linkcase_session_title } from '@core/consts'
import createDescriptor from '@core/fst/session/core/createDescriptor'
import createRuntime from '@core/fst/session/core/createRuntime'
import isSameDescriptor from '@core/fst/session/core/isSameDescriptor'
import resolvePlugins from '@core/fst/session/core/resolvePlugins'
import dayjs from 'dayjs'

import { GroupStore, GroupStreamStore, SessionEventStore, SessionStore, SessionStreamStore } from './session'

export interface ConnectSessionArgs {
	id: string
	is_cron?: boolean
	title?: string
}

const createSession = async (args: ConnectSessionArgs, descriptor: Awaited<ReturnType<typeof createDescriptor>>) => {
	const { id, is_cron, title } = args
	const plugin_defs = resolvePlugins(descriptor)
	const session = await createRuntime(descriptor, plugin_defs)
	const group_id = descriptor.groupId || undefined

	await session.init({
		id,
		event: SessionEventStore,
		is_cron,
		title:
			title ||
			(id === global_linkcase_session_id
				? global_linkcase_session_title
				: `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`),
		...(group_id ? { group_id } : {})
	})

	SessionStore.set(id, session)

	if (session.scope.type === 'group') {
		GroupStore.set(id, session)
	} else {
		GroupStore.delete(id)
	}

	return session
}

export default async (args: ConnectSessionArgs) => {
	const { id } = args
	const descriptor = await createDescriptor(id)

	let session = SessionStore.get(id)!

	if (!session) {
		session = await createSession(args, descriptor)
	} else if (!isSameDescriptor(session.descriptor, descriptor)) {
		await session.abortStream()
		await SessionStreamStore.unsubscribe(id)
		await GroupStreamStore.unsubscribe(id)
		SessionStore.delete(id)
		GroupStore.delete(id)
		session = await createSession(args, descriptor)
	} else {
		await session.updateConfig()
	}

	return session
}
