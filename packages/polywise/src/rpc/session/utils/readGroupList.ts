import fs from 'fs-extra'

import normalizeGroupList from './normalizeGroupList'
import { session_group_path } from './paths'

export default async () => {
	const raw = await fs.readJson(session_group_path, { throws: false })

	return normalizeGroupList(raw)
}
