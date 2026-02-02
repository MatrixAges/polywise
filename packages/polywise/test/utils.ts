import * as path from 'node:path'
import fs from 'fs-extra'
import { globSync } from 'glob'

export const cleanupTestDatabases = () => {
	const patterns = [
		path.join(process.cwd(), ':polywise_*'),
		path.join(process.cwd(), 'packages/polywise/:polywise_*')
	]

	for (const pattern of patterns) {
		const files = globSync(pattern)

		for (const file of files) {
			if (fs.pathExistsSync(file)) {
				try {
					fs.removeSync(file)
				} catch (error) {
					// Ignore errors if the file is already gone or busy
				}
			}
		}
	}
}
