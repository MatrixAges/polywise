import { convertToModelMessages } from 'ai'

import createSuperegoAgent from './agent'

import type Session from '../../session'
import type { ScopeInfo } from './types'

const getScope = (s: Session): ScopeInfo => {
	if (s.project) {
		return { scope_type: 'project', scope_id: s.project.id }
	}

	if (s.agents.length > 0) {
		return { scope_type: 'agent', scope_id: s.agents[0].id }
	}

	return { scope_type: 'global', scope_id: null }
}

export default async (s: Session) => {
	const scope = getScope(s)

	const recent_messages = s.model_messages.slice(-6)

	if (recent_messages.length === 0) {
		return
	}

	const model_messages = await convertToModelMessages(recent_messages)

	const conversation = model_messages
		.map(m => {
			const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)

			return `[${m.role}]: ${content}`
		})
		.join('\n\n')

	const agent = createSuperegoAgent(s.model.model, s, scope)

	await agent.generate({
		prompt: `Analyze the following conversation fragment and extract memories, knowledge, and skills as appropriate.\n\n---\n\n${conversation}`
	})
}
