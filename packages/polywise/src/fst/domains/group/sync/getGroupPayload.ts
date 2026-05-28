import type Session from '../../../session'

export default (s: Session) => ({
	id: s.group!.id,
	name: s.group!.name,
	description: s.group!.description ?? null,
	agents: s.agents.map(agent => ({
		id: agent.id,
		name: agent.name,
		role: agent.role,
		photo: (agent.photo as Uint8Array | null | undefined) ?? null,
		avatar: agent.avatar ?? null
	}))
})
