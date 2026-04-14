import path from 'path'
import fs from 'fs-extra'

import type Index from '../index'

export default async (s: Index) => {
	const plan_path = path.resolve(s.session_dir, 'plan.md')
	const exists = await fs.pathExists(plan_path)

	if (exists) {
		await fs.remove(plan_path)
	}
}
