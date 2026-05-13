import type { ChatEventRes } from '../../types'
import type Group from '../index'

export default async (s: Group) => {
	s.active()

	await Promise.all([s.getAgents(), s.getFolders(), s.getProject(), s.getMessages()])

	return {
		type: 'sync',
		data: s.getSyncData()
	} as ChatEventRes
}
