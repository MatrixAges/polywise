import fs from 'fs-extra'

import { session_group_path } from './paths'

import type { SessionGroupItem } from './types'

export default async (group_list: Array<SessionGroupItem>) => {
	await fs.writeJson(session_group_path, group_list, { spaces: 4 })
}
