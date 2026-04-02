import { tool } from 'ai'
import { globby } from 'globby'
import { array, object, string } from 'zod'

const inputSchema = object({
	patterns: array(string()).describe('Glob patterns to match files against'),
	cwd: string().optional().describe('Working directory to resolve patterns from')
})

export const createGlobTool = () => {
	return tool({
		description: 'Search for files matching glob patterns. Use to find files by name or pattern.',
		inputSchema,
		execute: async input => {
			const files = await globby(input.patterns, {
				cwd: input.cwd,
				absolute: true
			})

			return { patterns: input.patterns, files, count: files.length }
		}
	})
}
