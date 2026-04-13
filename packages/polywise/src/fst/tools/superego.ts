import { tool } from 'ai'
import { enum as Enum, object, string } from 'zod'

import { extract } from '../agents/superego'

import type Session from '../session'

const inputSchema = object({
	content: string().describe(
		'The specific content or conversation context to extract from. Provide a clear description of what should be remembered or learned.'
	),
	target: Enum(['memory', 'wiki', 'skill']).describe(
		'The type of information to extract: memory (user preferences/state), wiki (technical knowledge), skill (procedural SOP)'
	)
})

export const createSuperegoTool = (s: Session) => {
	return tool({
		description: [
			'Trigger the Superego Agent to extract and persist specific information from the conversation.',
			'Use this when the user explicitly asks to remember something, or when you identify valuable information',
			'that should be persisted as memory, wiki knowledge, or a reusable skill.',
			'',
			'This is the ONLY way for the main agent to write to memory or wiki. Direct writes are not permitted.',
			'The superego agent will analyze the provided content and decide the best extraction strategy.'
		].join('\n'),
		inputSchema,
		execute: async () => {
			extract(s)

			return 'Processing in background'
		}
	})
}
