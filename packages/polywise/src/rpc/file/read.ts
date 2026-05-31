import path from 'path'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	path: string()
})

const output_type = object({
	name: string(),
	contents: string(),
	path: string()
}).nullable()

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/file/read',
			description: 'Read a file'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const target_path = path.resolve(input.path)

		if (!(await fs.pathExists(target_path))) {
			return null
		}

		const contents = await fs.readFile(target_path, 'utf8')

		return {
			name: path.basename(target_path),
			contents,
			path: target_path
		}
	})
