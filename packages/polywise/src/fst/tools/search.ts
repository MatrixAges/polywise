import path from 'path'
import { tool } from 'ai'
import fs from 'fs-extra'
import { array, number, object, string } from 'zod'

import { checkPermission } from '../utils'
import { escapeShellArg } from '../utils/safeshell'

import type { Bash } from 'just-bash'
import type Session from '../session'

interface SearchMatch {
	file: string
	line: number
	content: string
}

interface SearchResult {
	keyword: string
	matches: Array<SearchMatch>
	count: number
	timed_out?: boolean
	error?: string
}

const inputSchema = object({
	keyword: string().describe('Keyword to search for in file contents'),
	paths: array(string()).optional().describe('Virtual paths to search in (defaults to /)'),
	extensions: array(string()).optional().describe('File extensions to filter, e.g. [".ts", ".md"]'),
	max_results: number().optional().describe('Maximum number of results to return (default 50)')
})

const MAX_LINE_LENGTH = 80
const SEARCH_TIMEOUT_MS = 30000

const splitOutputLines = (stdout: string) => {
	return stdout.split('\n').filter(Boolean)
}

const parseMatchLine = (line: string) => {
	const colon_1 = line.indexOf(':')
	const colon_2 = line.indexOf(':', colon_1 + 1)

	if (colon_1 === -1 || colon_2 === -1) return null

	const file = line.slice(0, colon_1)
	const line_num = parseInt(line.slice(colon_1 + 1, colon_2), 10)
	const content = line.slice(colon_2 + 1)

	if (Number.isNaN(line_num)) return null

	const truncated = content.length > MAX_LINE_LENGTH ? content.slice(0, MAX_LINE_LENGTH) + '...' : content

	return {
		file: file.startsWith('/') ? file.slice(1) : file,
		line: line_num,
		content: truncated.trim()
	} satisfies SearchMatch
}

const buildGlobFilter = (extensions: Array<string>) => {
	return extensions.map(ext => `--glob=${escapeShellArg(`*${ext}`)}`).join(' ')
}

const buildExcludeFilter = (exclude_dirs: Array<string>) => {
	return exclude_dirs.map(dir => `--glob=${escapeShellArg(`!${dir}/**`)}`).join(' ')
}

const buildGrepExtensionFilter = (extensions: Array<string>) => {
	return extensions.map(ext => `--include=${escapeShellArg(`*${ext}`)}`).join(' ')
}

const buildGrepExcludeFilter = (exclude_dirs: Array<string>) => {
	return exclude_dirs.map(dir => `--exclude-dir=${escapeShellArg(dir)}`).join(' ')
}

const buildSearchCommand = (args: {
	keyword: string
	search_path: string
	remaining_results: number
	extensions: Array<string>
	exclude_dirs: Array<string>
}) => {
	const { keyword, search_path, remaining_results, extensions, exclude_dirs } = args

	const rg_include_filter = buildGlobFilter(extensions)
	const rg_exclude_filter = buildExcludeFilter(exclude_dirs)
	const grep_include_filter = buildGrepExtensionFilter(extensions)
	const grep_exclude_filter = buildGrepExcludeFilter(exclude_dirs)

	const rg_command = [
		'rg',
		'--line-number',
		'--ignore-case',
		'--no-heading',
		'--color=never',
		`--max-count=${remaining_results}`,
		rg_exclude_filter,
		rg_include_filter,
		escapeShellArg(keyword),
		escapeShellArg(search_path)
	]
		.filter(Boolean)
		.join(' ')

	const grep_command = [
		'grep',
		'-RIn',
		'--binary-files=without-match',
		`--max-count=${remaining_results}`,
		grep_exclude_filter,
		grep_include_filter,
		escapeShellArg(keyword),
		escapeShellArg(search_path)
	]
		.filter(Boolean)
		.join(' ')

	return `command -v rg >/dev/null 2>&1 && ${rg_command} || ${grep_command}`
}

const executeSearchCommand = async (args: {
	bash: Bash
	command: string
	search_timeout_ms: number
	keyword: string
	matches: Array<SearchMatch>
	count: number
	path: string
}) => {
	const { bash, command, search_timeout_ms, keyword, matches, count, path } = args

	const command_promise = bash.exec(command, { cwd: '/' })
	const timeout_promise = new Promise<{ stdout: string; stderr: string; exitCode: number; result: SearchResult }>(
		resolve => {
			setTimeout(() => {
				resolve({
					stdout: '',
					stderr: `Search timed out after ${search_timeout_ms}ms for ${path}`,
					exitCode: 124,
					result: {
						keyword,
						matches,
						count,
						timed_out: true,
						error: `Search timed out after ${search_timeout_ms}ms`
					}
				})
			}, search_timeout_ms)
		}
	)

	try {
		return await Promise.race([command_promise, timeout_promise])
	} catch (error: unknown) {
		throw error
	}
}

const parseGitignoreDirs = async (cwd: string): Promise<Array<string>> => {
	const gitignore_path = path.join(cwd, '.gitignore')

	const exists = await fs.pathExists(gitignore_path)
	if (!exists) return []

	const content = await fs.readFile(gitignore_path, 'utf8')

	return content
		.split('\n')
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#'))
		.filter(line => line.endsWith('/'))
		.map(line => line.replace(/\/$/, ''))
}

export const createSearchFileTool = (s: Session, bash: Bash) => {
	return tool({
		description:
			'Search for keyword in file contents. Returns matching files with line numbers and snippets. Use for code/text content search.',
		inputSchema,
		execute: async input => {
			const search_paths = input.paths ?? ['/']
			const max_results = input.max_results ?? 30
			const exclude_dirs = await parseGitignoreDirs(s.cwd)

			const perm_error = await checkPermission(s, 'bash', 'execute', `search ${input.keyword}`)

			if (perm_error) {
				return { keyword: input.keyword, matches: [], count: 0, error: perm_error }
			}

			const matches: Array<SearchMatch> = []

			for (const search_path of search_paths) {
				if (matches.length >= max_results) break

				const search_cmd = buildSearchCommand({
					keyword: input.keyword,
					search_path,
					remaining_results: max_results - matches.length,
					extensions: input.extensions ?? [],
					exclude_dirs
				})

				const res = await executeSearchCommand({
					bash,
					command: search_cmd,
					search_timeout_ms: SEARCH_TIMEOUT_MS,
					keyword: input.keyword,
					matches,
					count: matches.length,
					path: search_path
				})

				if ('result' in res) {
					return res.result
				}

				if (res.exitCode !== 0 && !res.stdout) continue

				const lines = splitOutputLines(res.stdout)

				for (const line of lines) {
					if (matches.length >= max_results) break

					const match = parseMatchLine(line)

					if (!match) continue

					matches.push(match)
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
