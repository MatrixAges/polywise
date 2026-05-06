import { tool } from 'ai'
import { array, enum as Enum, infer as Infer, object, record, string } from 'zod'

import type Session from '../session'

export const inputSchema = object({
	intent: string().optional().describe('User intent or goal for the current conversation'),
	context: string().max(3000).optional().describe('Core contextual information and current progress'),
	tasks: array(
		object({
			title: string().describe('Task title'),
			desc: string().describe('Task description'),
			status: Enum(['draft', 'processing', 'unreview', 'done', 'canceled', 'error', 'archive']).describe(
				'Task status: use "archive" to detach a completed task from the current session context'
			),
			result: string().optional().describe('Task result when completed'),
			error: string().optional().describe('Error message when task fails')
		})
	)
		.optional()
		.describe('List of tasks being tracked'),
	files: array(
		object({
			path: string().describe('File path'),
			desc: string().describe('File description or purpose'),
			status: Enum(['read', 'modified', 'created', 'deleted'])
				.optional()
				.describe('File modification status')
		})
	)
		.optional()
		.describe('Files referenced or modified in the conversation'),
	constraints: array(string()).optional().describe('Hard rules or constraints that must be followed'),
	learned: array(string()).optional().describe('Failed approaches or errors to avoid repeating'),
	environment: record(string(), string())
		.optional()
		.describe('Runtime environment details such as versions or paths'),
	blockers: array(string()).optional().describe('Issues blocking progress that require user input')
})

export type ContextInput = Infer<typeof inputSchema>

export const createContextTool = (session: Session) => {
	return tool({
		description: [
			'Update persistent context state when context changes significantly. Use this tool to maintain window context.',
			'Before finalizing each user-facing response, do a final context check: if intent/context/tasks/files/constraints/learned/environment/blockers changed, call context_tool first, then answer.',
			'Do not call context_tool when there is no substantial context change.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			return session.setContext(input)
		}
	})
}
