import type { ChatEventRes } from '../../types'
import type Session from '../index'

export default async (s: Session) => {
	s.active()

	await Promise.all([s.getModel(), s.getAgents(), s.getOwnerAgent(), s.getProject(), s.getMessages()])

	if (s.caps.rel.getFolders) {
		await s.caps.rel.getFolders(s)
	}

	return {
		type: 'sync',
		data: await s.getSyncData()
	} as ChatEventRes
}
