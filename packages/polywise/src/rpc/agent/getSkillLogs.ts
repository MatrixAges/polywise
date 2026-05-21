import { number, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { readAgentLogPage } from './logs'

import type { AgentSkillLogEntry } from './logs'

const input_type = object({
	agent_id: string(),
	date: string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	page: number().int().min(1)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getSkillLogs',
			summary: 'Read Get Skill Logs'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		return readAgentLogPage<AgentSkillLogEntry>({
			agent_id: input.agent_id,
			date: input.date,
			kind: 'skills',
			page: input.page
		})
	})
