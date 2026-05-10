import path from 'path'
import { app } from '@core/consts'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string()
})

export default p.input(input_type).query(async ({ input }) => {
	const files_dir = path.resolve(app.app_path, 'sessions', input.id, 'files')

	await fs.ensureDir(files_dir)

	return files_dir
})
