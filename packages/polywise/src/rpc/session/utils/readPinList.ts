import fs from 'fs-extra'

import normalizePinList from './normalizePinList'
import { pin_path } from './paths'

export default async () => {
	const raw = await fs.readJson(pin_path, { throws: false })

	return normalizePinList(raw)
}
