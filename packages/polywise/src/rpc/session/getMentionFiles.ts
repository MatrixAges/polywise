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
const search_ignore = ['**/.DS_Store', '**/node_modules/**', '**/.git/**']
const escape_glob = (value: string) => value.replace(/([*?[\]{}()!+@\\])/g, '[$1]')

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/getMentionFiles',
			summary: 'Read Get Mention Files'
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

		const safe_query = escape_glob(query)
		const paths = await globby([`**/*${safe_query}*`], {
			cwd: root,
			onlyFiles: false,
			absolute: false,
			markDirectories: true,
			gitignore: true,
			ignore: search_ignore,
			suppressErrors: true
		})
		const items = (
			await Promise.all(
				paths
					.filter(item => item !== '.DS_Store' && item !== '')
					.slice(0, search_limit)
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

		return {
			root: normalize_path(root),
			items
		}
	})
