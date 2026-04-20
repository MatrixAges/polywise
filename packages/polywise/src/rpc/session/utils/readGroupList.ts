import { app } from '@core/consts'
import fs from 'fs-extra'

import normalizeGroupList from './normalizeGroupList'

export default async () => {
	const raw = await fs.readJson(app.session_group_path, { throws: false })

	return normalizeGroupList(raw)
}
