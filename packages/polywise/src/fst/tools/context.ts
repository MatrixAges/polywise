import { tool } from 'ai'
import { array, enum as Enum, object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	intent: string().describe('User intent or goal'),
	context: string().describe('Core contextual information'),
	tasks: array(
		object({
			title: string(),
			status: Enum(['pending', 'runing', 'done'])
		})
	).describe('Task list'),
	files: array(string()).describe('Associated files')
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
