import path from 'path'
import { app } from '@core/consts'
import fs from 'fs-extra'

import normalizeGroupList from './normalizeGroupList'

export default async () => {
	try {
		const raw = await fs.readJson(app.session_group_path, { throws: false })

		return normalizeGroupList(raw)
	} catch (error) {
		const parsed_error = error as NodeJS.ErrnoException

		if (parsed_error.code === 'ENOENT') {
			await fs.ensureDir(path.dirname(app.session_group_path))
			await fs.writeJson(app.session_group_path, [], { spaces: 4 })

			return []
		}

		return []
	}
}
