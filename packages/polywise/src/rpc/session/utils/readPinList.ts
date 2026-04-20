import { app } from '@core/consts'
import fs from 'fs-extra'

import normalizePinList from './normalizePinList'

export default async () => {
	const raw = await fs.readJson(app.pin_path, { throws: false })

	return normalizePinList(raw)
}
