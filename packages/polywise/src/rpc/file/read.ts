import path from 'path'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	path: string()
})

export default p.input(input_type).query(async ({ input }) => {
	const target_path = path.resolve(input.path)

	if (!(await fs.pathExists(target_path))) {
		return null
	}

	const contents = await fs.readFile(target_path, 'utf8')

	return {
		name: path.basename(target_path),
		contents
	}
})
