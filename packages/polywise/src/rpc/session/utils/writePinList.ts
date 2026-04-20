import fs from 'fs-extra'

import { pin_path } from './paths'

export default async (pin_list: Array<string>) => {
	await fs.writeJson(pin_path, Array.from(new Set(pin_list)), { spaces: 4 })
}
