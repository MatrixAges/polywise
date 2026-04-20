import { app } from '@core/consts'
import fs from 'fs-extra'

import type { SessionGroupItem } from './types'

export default async (group_list: Array<SessionGroupItem>) => {
	await fs.writeJson(app.session_group_path, group_list, { spaces: 4 })
}
