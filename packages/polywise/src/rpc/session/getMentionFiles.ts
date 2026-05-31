import path from 'path'
import { connectSession, p } from '@core/utils'
import fs from 'fs-extra'
import { globby } from 'globby'
import { object, string } from 'zod'

const input_type = object({
	id: string(),
	query: string().optional()
})

const normalize_path = (value: string) => value.replace(/\\/g, '/')
const search_limit = 100
const search_candidate_limit = 500
const search_ignore = ['**/.DS_Store', '**/node_modules/**', '**/.git/**']
const escape_glob = (value: string) => value.replace(/([*?[\]{}()!+@\\])/g, '[$1]')
const escape_regex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const get_query_terms = (value: string) =>
	value
		.trim()
		.split(/[\/\s]+/)
		.map(item => item.trim())
		.filter(Boolean)
const find_case_insensitive_index = (value: string, term: string, from: number) => {
	const match = value.slice(from).match(new RegExp(escape_regex(term), 'i'))

	return match?.index === undefined ? -1 : from + match.index
}
const matches_ordered_terms = (value: string, terms: Array<string>) => {
	let index = 0

	for (const term of terms) {
		const found_index = find_case_insensitive_index(value, term, index)

		if (found_index === -1) {
			return false
		}

		index = found_index + term.length
	}

	return true
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/getMentionFiles',
			description: 'Read Get Mention Files'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const session = await connectSession({ id: input.id })
		const root = session.cwd
		const query = input.query?.trim() || ''

		if (!query) {
			const entries = await fs.readdir(root, { withFileTypes: true })

			const items = entries
				.filter(entry => entry.name !== '.DS_Store')
				.map(entry => {
					const relative_path = entry.isDirectory() ? `${entry.name}/` : entry.name

					return {
						path: normalize_path(relative_path),
						absolute_path: normalize_path(path.resolve(root, entry.name)),
						type: entry.isDirectory() ? ('directory' as const) : ('file' as const)
					}
				})
				.sort((a, b) => a.path.localeCompare(b.path))

			return {
				root: normalize_path(root),
				items
			}
		}

		const query_terms = get_query_terms(query)
		const pivot_term = escape_glob(query_terms.at(-1) || query)
		const paths = await globby([`**/*${pivot_term}*`], {
			cwd: root,
			onlyFiles: false,
			absolute: false,
			markDirectories: true,
			caseSensitiveMatch: false,
			gitignore: true,
			ignore: search_ignore,
			suppressErrors: true
		})
		const items = (
			await Promise.all(
				paths
					.filter(item => {
						if (item === '.DS_Store' || item === '') return false

						return matches_ordered_terms(normalize_path(item), query_terms)
					})
					.slice(0, search_candidate_limit)
					.map(async item => {
						const absolute_path = path.resolve(root, item.replace(/\/$/, ''))
						const stat = await fs.stat(absolute_path).catch(() => null)

						if (!stat) return null

						const is_directory = stat.isDirectory()
						const relative_path = normalize_path(
							is_directory ? `${item.replace(/\/$/, '')}/` : item
						)

						return {
							path: relative_path,
							absolute_path: normalize_path(absolute_path),
							type: is_directory ? ('directory' as const) : ('file' as const)
						}
					})
			)
		)
			.filter(item => !!item)
			.sort((a, b) => a.path.localeCompare(b.path))
			.slice(0, search_limit)

		return {
			root: normalize_path(root),
			items
		}
	})
