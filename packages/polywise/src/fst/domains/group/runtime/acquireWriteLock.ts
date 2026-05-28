import type { Agent } from '@core/db'
import type Session from '../../../session'

export default async (s: Session, agent: Agent, reason?: string) => {
	if (s.write_lock.agent_id && s.write_lock.agent_id !== agent.id) {
		return {
			acquired: false,
			holder_agent_id: s.write_lock.agent_id,
			holder_agent_name: s.write_lock.agent_name
		}
	}

	s.write_lock = {
		agent_id: agent.id,
		agent_name: agent.name,
		acquired_at: Date.now(),
		reason: reason || null
	}

	await s.setState()
	s.sync()

	return {
		acquired: true,
		holder_agent_id: agent.id,
		holder_agent_name: agent.name
	}
}
