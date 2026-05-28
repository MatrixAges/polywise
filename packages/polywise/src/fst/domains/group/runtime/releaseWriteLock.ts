import type { Agent } from '@core/db'
import type Session from '../../../session'

export default async (s: Session, agent: Agent, force = false) => {
	if (!force && s.write_lock.agent_id && s.write_lock.agent_id !== agent.id) {
		return {
			released: false,
			holder_agent_id: s.write_lock.agent_id,
			holder_agent_name: s.write_lock.agent_name
		}
	}

	s.write_lock = {
		agent_id: null,
		agent_name: null,
		acquired_at: null,
		reason: null
	}

	await s.setState()
	s.sync()

	return { released: true }
}
