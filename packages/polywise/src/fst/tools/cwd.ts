import { tool } from 'ai'
import { enum as enumSchema, object, string } from 'zod'

import type Index from '../session'

const inputSchema = object({
	action: enumSchema(['getCwd', 'setCwd']).describe(
		'Action to perform: getCwd to get current working directory, setCwd to change it'
	),
	path: string().optional().describe('New working directory path (required for setCwd)')
})

export const createCwdTool = (s: Index) => {
	return tool({
		description: 'Get or set the current working directory for file operations and command execution.',
		inputSchema,
		execute: async input => {
			if (input.action === 'getCwd') {
				return s.getCwd()
			}

			if (input.action === 'setCwd') {
				if (!input.path) {
					throw new Error('Path is required for setCwd action')
				}

				return s.setCwd(input.path)
			}

			throw new Error(`Unknown action: ${input.action}`)
		}
	})
}
