import { tool } from 'ai'
import { globby } from 'globby'
import { array, boolean, object, string } from 'zod'

import { checkPermission, getRealPath, toDisplayPath } from '../utils'

import type Session from '../session'

const inputSchema = object({
	patterns: array(string()).describe('Glob patterns to match files against'),
	cwd: string().optional().describe('Working directory to resolve patterns from'),
	disable_gitignore: boolean()
		.optional()
		.describe('Disable filtering by .gitignore and ignore rules (default false)')
})

export const createGlobTool = (s: Session) => {
	return tool({
		description: 'Search for files matching glob patterns. Use to find files by name or pattern.',
		inputSchema,
		execute: async input => {
			const path_mappings: Record<string, string> = {}

			if (s.skills_dir) {
				path_mappings['/skills'] = s.skills_dir
			}

			const real_cwd = input.cwd ? getRealPath(s.cwd, input.cwd, path_mappings) : s.cwd
			const permission_paths = extractPaths(input, s.cwd).map(path =>
				path.startsWith('/') ? getRealPath(s.cwd, path, path_mappings) : path
			)

			for (const path of permission_paths) {
				const perm_error = await checkPermission(s, 'glob', 'read', path)

				if (perm_error) {
					throw new Error(perm_error)
				}
			}

			const real_patterns = input.patterns.map(pattern =>
				pattern.startsWith('/') ? getRealPath(s.cwd, pattern, path_mappings) : pattern
			)

			const files = await globby(real_patterns, {
				cwd: real_cwd,
				absolute: true,
				gitignore: input.disable_gitignore !== true,
				// Skip unreadable directories instead of failing the entire glob request.
				suppressErrors: true
			})

			return {
				files: files.map(file => toDisplayPath({ real_path: file, cwd: real_cwd, path_mappings })),
				count: files.length
			}
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
