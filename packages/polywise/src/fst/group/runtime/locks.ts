import type { Agent } from '@core/db'
import type Group from '../index'
import type { GroupBarrierState } from '../types'

export const acquireWriteLock = async (s: Group, agent: Agent, reason?: string) => {
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

export const releaseWriteLock = async (s: Group, agent: Agent, force = false) => {
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

export const setBarrier = async (s: Group, barrier: GroupBarrierState | null) => {
	s.barrier = barrier

	await s.setState()
	s.sync()
}
