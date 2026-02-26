import path from 'path'
import fs from 'fs-extra'

const listRecursive = async (dir: string): Promise<Array<string>> => {
	if (!(await fs.pathExists(dir))) {
		return []
	}

	const entries = await fs.readdir(dir, { withFileTypes: true })
	const files = await Promise.all(
		entries.map(async entry => {
			const res = path.resolve(dir, entry.name)

			return entry.isDirectory() ? listRecursive(res) : res
		})
	)

	return files.flat() as Array<string>
}

export default listRecursive
