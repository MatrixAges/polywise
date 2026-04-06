import { tool } from 'ai'
import { array, number, object, string } from 'zod'

import { checkPermission, requestApproval } from '../session/permission'

import type { Bash } from 'just-bash'
import type Index from '../session'

const inputSchema = object({
	keyword: string().describe('Keyword to search for in file contents'),
	paths: array(string()).optional().describe('Virtual paths to search in (defaults to /)'),
	extensions: array(string()).optional().describe('File extensions to filter, e.g. [".ts", ".md"]'),
	max_results: number().optional().describe('Maximum number of results to return (default 50)')
})

const MAX_LINE_LENGTH = 80

export const createSearchFileTool = (s: Index, bash: Bash) => {
	return tool({
		description:
			'Search for keyword in file contents. Returns matching files with line numbers and snippets. Use for code/text content search.',
		inputSchema,
		execute: async input => {
			const search_paths = input.paths ?? ['/']
			const max_results = input.max_results ?? 30

			const result = checkPermission(s, 'bash', 'execute', `search ${input.keyword}`)

			if (result === 'needs_approval') {
				const approved = await requestApproval(s, 'bash', 'execute', `search ${input.keyword}`)

				if (!approved) {
					return { keyword: input.keyword, matches: [], count: 0, error: 'Permission denied' }
				}
			}

			const ext_filter = (input.extensions ?? []).map(ext => `--include="*${ext}"`).join(' ')

			const matches: Array<{ file: string; line: number; content: string }> = []

			for (const search_path of search_paths) {
				if (matches.length >= max_results) break

				const grep_cmd = [
					'grep',
					'-rn',
					'-i',
					`--max-count=${max_results - matches.length}`,
					ext_filter,
					`'${input.keyword}'`,
					`'${search_path}'`
				]
					.filter(Boolean)
					.join(' ')

				const res = await bash.exec(grep_cmd, { cwd: '/' })

				if (res.exitCode !== 0 && !res.stdout) continue

				const lines = res.stdout.split('\n').filter(Boolean)

				for (const line of lines) {
					if (matches.length >= max_results) break

					const colon1 = line.indexOf(':')
					const colon2 = line.indexOf(':', colon1 + 1)

					if (colon1 === -1 || colon2 === -1) continue

					const file = line.slice(0, colon1)
					const line_num = parseInt(line.slice(colon1 + 1, colon2), 10)
					const content = line.slice(colon2 + 1)

					if (Number.isNaN(line_num)) continue

					const truncated =
						content.length > MAX_LINE_LENGTH
							? content.slice(0, MAX_LINE_LENGTH) + '...'
							: content

					matches.push({
						file: file.startsWith('/') ? file.slice(1) : file,
						line: line_num,
						content: truncated.trim()
					})
				}
			}

			return {
				keyword: input.keyword,
				matches,
				count: matches.length
			}
		}
	})
}
