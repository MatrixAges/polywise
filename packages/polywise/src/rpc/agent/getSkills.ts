import { readAgentRuntimeConfig } from '@core/db/agentConfig'
import { object, string } from 'zod'

import { getAgentSkills } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({ agent_id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getSkills',
			description: 'Return the reusable skills currently assigned to one agent.'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const rows = await getAgentSkills(input.agent_id)
		const runtime_config = await readAgentRuntimeConfig(input.agent_id)
		const skill_enabled_map = new Map(
			runtime_config.has_skills
				? runtime_config.config.skills.map(item => [item.skill_id, item.enabled] as const)
				: []
		)

		return rows.map(item => ({
			...item.skill,
			enabled: skill_enabled_map.get(item.skill.id) ?? true
		}))
	})
