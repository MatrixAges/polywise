import path from 'path'
import { connectSession, p } from '@core/utils'
import { globby } from 'globby'
import { object, string } from 'zod'

const input_type = object({
	id: string()
})

const normalize_path = (value: string) => value.replace(/\\/g, '/')

export default p.input(input_type).query(async ({ input }) => {
	const session = await connectSession({ id: input.id })
	const root = session.cwd

	const list = await globby(['**/*'], {
		cwd: root,
		onlyFiles: false,
		markDirectories: true,
		gitignore: true,
		suppressErrors: true
	})

	const items = list
		.map(item => {
			const relative_path = normalize_path(item)

			return {
				path: relative_path,
				absolute_path: normalize_path(path.resolve(root, item)),
				type: relative_path.endsWith('/') ? ('directory' as const) : ('file' as const)
			}
		})
		.sort((a, b) => a.path.localeCompare(b.path))

	return {
		root: normalize_path(root),
		items
	}
})
