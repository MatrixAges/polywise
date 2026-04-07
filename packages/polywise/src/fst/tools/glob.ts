import { tool } from 'ai'
import { globby } from 'globby'
import { array, object, string } from 'zod'

import { approve, check } from '../agents'

import type Session from '../session'

const inputSchema = object({
	patterns: array(string()).describe('Glob patterns to match files against'),
	cwd: string().optional().describe('Working directory to resolve patterns from')
})

export const createGlobTool = (s: Session) => {
	return tool({
		description: 'Search for files matching glob patterns. Use to find files by name or pattern.',
		inputSchema,
		execute: async input => {
			const paths = extractPaths(input, s.cwd)

			for (const path of paths) {
				const result = check(s, 'glob', 'read', path)

				if (result === 'needs_approval') {
					const approved = await approve(s, 'glob', 'read', path)

					if (!approved) {
						throw new Error(`Permission denied: glob read ${path}`)
					}
				}
			}

			const files = await globby(input.patterns, {
				cwd: input.cwd ?? s.cwd,
				absolute: true
			})

			return { patterns: input.patterns, files, count: files.length }
		}
	})
}

const extractPaths = (input: { patterns: Array<string>; cwd?: string }, sessionCwd: string): Array<string> => {
	const paths: Array<string> = []

	const resolvedCwd = input.cwd ?? sessionCwd
	if (resolvedCwd) {
		paths.push(resolvedCwd)
	}

	for (const pattern of input.patterns) {
		if (pattern.startsWith('/')) {
			paths.push(pattern)
		}
	}

	return paths
}
