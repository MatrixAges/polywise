import { join } from 'path'
import { readFile, writeFile } from 'atomically'
import to from 'await-to-js'
import { deepmerge as Deepmerge } from 'deepmerge-ts'

import { workspace_data_path } from '@desktop/utils'

interface Args {
	filename: string
	data: any
	module?: string
	ext?: string
}

export const write = async (args: Args & { merge?: boolean; deepmerge?: boolean }) => {
	const { filename, data, module, ext = 'json', merge, deepmerge } = args

	let target = data

	if (merge || deepmerge) {
		const [err, res] = await to(read({ module, filename }))

		if (!err && res) {
			if (merge) {
				target = { ...res, ...data }
			} else {
				target = Deepmerge(res, data)
			}
		}
	}

	await writeFile(
		join(workspace_data_path, module && module !== 'global' ? `/${module}` : '', `/${filename}.${ext}`),
		JSON.stringify(target, null, 6)
	)
}

export const read = async (args: Omit<Args, 'data'>) => {
	const { filename, module, ext = 'json' } = args

	const [err, res] = await to(
		readFile(
			join(workspace_data_path, module && module !== 'global' ? `/${module}` : '', `/${filename}.${ext}`)
		)
	)

	if (err) return undefined

	return JSON.parse(res.toString())
}
