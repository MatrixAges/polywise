import path from 'path'
import { app } from '@core/consts'
import fs from 'fs-extra'

import normalizePinList from './normalizePinList'

export default async () => {
	try {
		const raw = await fs.readJson(app.pin_path, { throws: false })

		return normalizePinList(raw)
	} catch (error) {
		const parsed_error = error as NodeJS.ErrnoException

		if (parsed_error.code === 'ENOENT') {
			await fs.ensureDir(path.dirname(app.pin_path))
			await fs.writeJson(app.pin_path, [], { spaces: 4 })

			return []
		}

		return []
	}
}
