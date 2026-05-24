import path from 'path'
import { connectSession, p } from '@core/utils'
import fs from 'fs-extra'
import { object, string } from 'zod'

const input_type = object({
	id: string()
})

const normalize_path = (value: string) => value.replace(/\\/g, '/')

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
	})
