import path from 'path'
import { app } from '@core/consts'
import { p } from '@core/utils'
import { readFile, writeFile } from 'atomically'
import { to } from 'await-to-js'
import { deepmerge } from 'deepmerge-ts'
import ntry from 'nice-try'
import { any, boolean, object, string } from 'zod'

const input_type = object({
	path: string(),
	data: any(),
	merge: boolean().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/file/write',
			description: 'Write JSON data to a local file and optionally deep-merge with existing content.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const { path: file_path, data, merge } = input

		let target_data = data

		const target_path = path.resolve(`${app.app_path}/${file_path}`)

		if (merge) {
			const [err, res] = await to(readFile(target_path))

			if (!err && res) {
				const target_res = ntry(() => JSON.parse(res.toString()))

				if (target_res) target_data = deepmerge(target_res, data)
			}
		}

		await writeFile(target_path, JSON.stringify(target_data, null, 4))
	})
