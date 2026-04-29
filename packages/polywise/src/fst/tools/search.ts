import path from 'path'
import { tool } from 'ai'
import { array, boolean, number, object, string } from 'zod'

import grep from '../../utils/grep'
import { checkPermission } from '../utils'
import getRealPath from '../utils/getRealPath'

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
	error?: string
}

const inputSchema = object({
	keyword: string().describe('Keyword to search for in file contents'),
	paths: array(string()).optional().describe('Virtual paths to search in (defaults to /)'),
	extensions: array(string()).optional().describe('File extensions to filter, e.g. [".ts", ".md"]'),
	max_results: number().optional().describe('Maximum number of results to return (default 50)'),
	disable_gitignore: boolean()
		.optional()
		.describe('Disable filtering by .gitignore and ignore rules (default false)')
})

const MAX_LINE_LENGTH = 80
const normalizeVirtualPath = (virtual_path: string) => {
	if (!virtual_path || virtual_path === '.') return '/'

	const normalized_path = virtual_path.startsWith('/')
		? path.posix.normalize(virtual_path)
		: path.posix.normalize(`/${virtual_path}`)

	return normalized_path === '.' ? '/' : normalized_path
}

const toVirtualPath = (args: { real_path: string; cwd: string; path_mappings: Record<string, string> }) => {
	const { real_path, cwd, path_mappings } = args
	const normalized_real_path = path.resolve(real_path)
	const mapping_list = Object.entries(path_mappings)
		.map(([prefix, mapped_dir]) => ({
			prefix,
			mapped_dir: path.resolve(mapped_dir)
		}))
		.sort((left, right) => right.mapped_dir.length - left.mapped_dir.length)

	for (const { prefix, mapped_dir } of mapping_list) {
		if (normalized_real_path === mapped_dir) return normalizeVirtualPath(prefix)

		const mapped_prefix = `${mapped_dir}${path.sep}`

		if (!normalized_real_path.startsWith(mapped_prefix)) continue

		const relative_path = path.relative(mapped_dir, normalized_real_path).split(path.sep).join('/')

		return normalizeVirtualPath(path.posix.join(prefix, relative_path))
	}

	const relative_path = path.relative(path.resolve(cwd), normalized_real_path).split(path.sep).join('/')

	return normalizeVirtualPath(relative_path)
}

const parseMatchLine = (args: { line: string; cwd: string; path_mappings: Record<string, string> }) => {
	const { line, cwd, path_mappings } = args
	const colon_1 = line.indexOf(':')
	const colon_2 = line.indexOf(':', colon_1 + 1)

	if (colon_1 === -1 || colon_2 === -1) return null

	const raw_file = line.slice(0, colon_1)
	const line_num = parseInt(line.slice(colon_1 + 1, colon_2), 10)
	const content = line.slice(colon_2 + 1)

	if (Number.isNaN(line_num)) return null

	const absolute_path = path.resolve(cwd, raw_file)
	const truncated = content.length > MAX_LINE_LENGTH ? content.slice(0, MAX_LINE_LENGTH) + '...' : content

	return {
		file: toVirtualPath({ real_path: absolute_path, cwd, path_mappings }),
		line: line_num,
		content: truncated.trim()
	} satisfies SearchMatch
}

const getSearchTargets = (args: { cwd: string; paths?: Array<string>; path_mappings: Record<string, string> }) => {
	const { cwd, paths, path_mappings } = args
	const virtual_path_list = paths && paths.length > 0 ? paths : ['/']

	return virtual_path_list.map(virtual_path => {
		const normalized_virtual_path = normalizeVirtualPath(virtual_path)
		const absolute_path = getRealPath(cwd, normalized_virtual_path, path_mappings)

		return {
			virtual_path: normalized_virtual_path,
			absolute_path: path.resolve(absolute_path)
		}
	})
}

export const createSearchFileTool = (s: Session, bash: Bash) => {
	return tool({
		description:
			'Search for keyword in file contents. Returns matching files with line numbers and snippets. Use for code/text content search.',
		inputSchema,
		execute: async input => {
			void bash

			const path_mappings: Record<string, string> = {}

			if (s.skills_dir) {
				path_mappings['/skills'] = s.skills_dir
			}

			const search_target_list = getSearchTargets({
				cwd: s.cwd,
				paths: input.paths,
				path_mappings
			})
			const max_results = input.max_results ?? 30

			const perm_error = await checkPermission(s, 'bash', 'execute', `search ${input.keyword}`)

			if (perm_error) {
				return { keyword: input.keyword, matches: [], count: 0, error: perm_error }
			}

			const lines = await grep(
				search_target_list.map(search_target => search_target.absolute_path),
				input.keyword,
				{
					max_count: max_results,
					glob: (input.extensions ?? []).map(extension => `*${extension}`),
					disable_gitignore: input.disable_gitignore,
					with_filename: true,
					with_line_number: true
				}
			)
			const matches = lines
				.map(line =>
					parseMatchLine({
						line,
						cwd: s.cwd,
						path_mappings
					})
				)
				.filter(match => match !== null)
				.slice(0, max_results)

			const error =
				search_target_list.length > 0 && matches.length === 0
					? 'No matches found or search command returned no readable output.'
					: undefined

			return {
				keyword: input.keyword,
				matches,
				count: matches.length,
				error
			}
		}
	})
}
