import { tool } from 'ai'
import { array, enum as Enum, object, record, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	intent: string().optional().describe('User intent or goal for the current conversation'),
	context: string().max(3000).optional().describe('Core contextual information and current progress'),
	tasks: array(
		object({
			title: string().describe('Task title'),
			desc: string().describe('Task description'),
			status: Enum(['draft', 'pending', 'processing', 'done', 'error', 'archive']).describe(
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
				.describe('File modification status'),
			summary: string().optional().describe('Brief summary of file content')
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
