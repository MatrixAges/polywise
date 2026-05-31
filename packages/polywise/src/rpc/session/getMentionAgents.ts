import { getAgents } from '@core/db/services'
import { connectSession, p } from '@core/utils'
import { object, string } from 'zod'

const input_type = object({
	id: string()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/getMentionAgents',
			description: 'List agents available for @mentions in the current session scope.'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const session = await connectSession({ id: input.id })

		if (session.scope.type === 'group') {
			await session.getAgents()

			return session.agents.map(item => ({
				id: item.id,
				name: item.name,
				role: item.role,
				description: item.description ?? '',
				photo: item.photo ?? null,
				avatar: item.avatar ?? null
			}))
		}

		if (!session.enable_agent_tool) {
			return []
		}

		const agents = await getAgents()
		const allowed_agent_ids = new Set(session.agent_ids || [])
		const filtered_agents = allowed_agent_ids.size
			? agents.filter(item => allowed_agent_ids.has(item.id))
			: agents

		return filtered_agents.map(item => ({
			id: item.id,
			name: item.name,
			role: item.role,
			description: item.description ?? '',
			photo: item.photo ?? null,
			avatar: item.avatar ?? null
		}))
	})
