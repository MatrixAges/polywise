import { tool } from 'ai'
import { array, enum as Enum, object, record, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	intent: string().optional().describe('Update user intent or goal'),
	context: string().max(3000).optional().describe('Update core contextual information'),
	tasks: array(
		object({
			title: string(),
			desc: string(),
			status: Enum(['pending', 'runing', 'done']),
			result: string().optional(),
			error: string().optional()
		})
	)
		.optional()
		.describe('Replace entire task list'),
	files: array(
		object({
			path: string(),
			desc: string(),
			status: Enum(['read', 'modified', 'created', 'deleted']).optional(),
			summary: string().optional()
		})
	)
		.optional()
		.describe('Replace associated file list'),
	constraints: array(string()).optional().describe('Update hard constraints'),
	lessons_learned: array(string()).optional().describe('Update failed approaches or errors'),
	environment: record(string(), string()).optional().describe('Update runtime environment'),
	blockers: array(string()).optional().describe('Update current blockers')
})

export const createContextTool = (session: Session) => {
	return tool({
		description:
			'Update persistent context state when context changes significantly. Use this tool to maintain window context.',
		inputSchema,
		execute: async input => {
			return session.setContext(input)
		}
	})
}
