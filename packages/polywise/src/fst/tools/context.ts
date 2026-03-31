import { tool } from 'ai'
import { array, enum as Enum, object, record, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	intent: string().describe('User intent or goal'),
	context: string().describe('Core contextual information'),
	tasks: array(
		object({
			title: string(),
			desc: string(),
			status: Enum(['pending', 'runing', 'done']),
			result: string().optional(),
			error: string().optional()
		})
	).describe('Task list'),
	files: array(
		object({
			path: string(),
			desc: string(),
			status: Enum(['read', 'modified', 'created', 'deleted']).optional(),
			summary: string().optional()
		})
	).describe('Associated files'),
	constraints: array(string()).optional().describe('Hard constraints for current task'),
	lessons_learned: array(string()).optional().describe('Failed approaches or errors to avoid'),
	environment: record(string(), string()).optional().describe('Runtime environment info'),
	blockers: array(string()).optional().describe('Current blockers requiring user input')
})

export const createContextTool = (session: Session) => {
	return tool({
		description:
			'Update persistent context state. AI MUST call this tool every conversation to maintain window context.',
		inputSchema,
		execute: async input => {
			return session.setContext(input)
		}
	})
}
