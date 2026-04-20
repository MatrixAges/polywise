import { app } from '@core/consts'
import fs from 'fs-extra'

import type { SessionPinItem } from './types'

export default async (pin_list: Array<SessionPinItem>) => {
	const pin_map = new Map<string, SessionPinItem>()

	pin_list.forEach(item => {
		pin_map.set(item.id, item)
	})

	await fs.writeJson(app.pin_path, Array.from(pin_map.values()), { spaces: 4 })
}
