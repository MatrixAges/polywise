import path from 'path'
import fs from 'fs-extra'

import type { IProjectTreeItem } from '../types'

const readProjectTree = async (dir_path: string) => {
	const results = [] as Array<IProjectTreeItem>

	if (!(await fs.pathExists(dir_path))) {
		return results
	}

	const entries = await fs.readdir(dir_path, { withFileTypes: true })

	for (const entry of entries) {
		const next_path = path.resolve(dir_path, entry.name)

		results.push({
			id: next_path,
			name: entry.name,
			dir: next_path,
			file_type: entry.isDirectory() ? 'directory' : 'file'
		})

		if (entry.isDirectory()) {
			const child_items = await readProjectTree(next_path)

			results.push(...child_items)
		}
	}

	return results
}

export default readProjectTree
