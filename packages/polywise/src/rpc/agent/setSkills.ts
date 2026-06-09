import { patchAgentRuntimeConfig } from '@core/db/agentConfig'
import { assertAgentWritableForBehavior } from '@core/db/services'
import { SessionStore } from '@core/utils'
import { array, boolean, object, string } from 'zod'

import { replaceAgentSkills } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	skills: array(
		object({
			skill_id: string(),
			enabled: boolean().optional()
		})
	).optional(),
	skill_ids: array(string()).optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/setSkills',
			description: 'Replace the full set of skills assigned to one agent.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		await assertAgentWritableForBehavior(input.agent_id)

		const skills = Array.isArray(input.skills)
			? input.skills.map(item => ({
					skill_id: item.skill_id,
					enabled: item.enabled !== false
				}))
			: Array.isArray(input.skill_ids)
				? input.skill_ids.map(skill_id => ({ skill_id, enabled: true }))
				: []

		const result = await replaceAgentSkills({
			agent_id: input.agent_id,
			skill_ids: skills.map(item => item.skill_id)
		})

		await patchAgentRuntimeConfig({
			agent_id: input.agent_id,
			patch: {
				skills
			}
		})

		for (const session of SessionStore.values()) {
			if (session.owner_agent?.id !== input.agent_id) {
				continue
			}

			await session.loadSkillMap()
		}

		return result
	})
