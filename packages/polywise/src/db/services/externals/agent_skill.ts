import { agent_skill, skill } from '@core/db/schema'
import { env } from '@core/env'
import { asc, eq, inArray, SQL } from 'drizzle-orm'

export const getAgentSkills = async (agent_id: string) => {
	return env.db
		.select({ skill })
		.from(agent_skill)
		.innerJoin(skill, eq(agent_skill.skill_id, skill.id))
		.where(eq(agent_skill.agent_id, agent_id))
		.orderBy(asc(skill.name))
}

export const addAgentSkill = async (agent_id: string, skill_id: string) => {
	return env.db
		.insert(agent_skill)
		.values({ agent_id, skill_id })
		.returning()
		.then(res => res[0])
}

export const removeAgentSkill = async (where: SQL) => {
	return env.db
		.delete(agent_skill)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeAgentSkillsBySkillIds = async (skill_ids: Array<string>) => {
	if (!skill_ids.length) {
		return [] as Array<unknown>
	}

	return env.db.delete(agent_skill).where(inArray(agent_skill.skill_id, skill_ids)).returning()
}

export const replaceAgentSkills = async (args: { agent_id: string; skill_ids: Array<string> }) => {
	const { agent_id, skill_ids } = args

	return env.db.transaction(tx => {
		tx.delete(agent_skill).where(eq(agent_skill.agent_id, agent_id)).run()

		if (!skill_ids.length) {
			return [] as Array<string>
		}

		tx.insert(agent_skill)
			.values(skill_ids.map(skill_id => ({ agent_id, skill_id })))
			.run()

		return skill_ids
	})
}
