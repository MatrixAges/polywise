import { app } from '@core/consts'
import fs from 'fs-extra'

export default async (pin_list: Array<string>) => {
	await fs.writeJson(app.pin_path, Array.from(new Set(pin_list)), { spaces: 4 })
}
