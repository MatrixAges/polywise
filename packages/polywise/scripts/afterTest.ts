import path from 'node:path'
import fs from 'fs-extra'
import { globSync } from 'glob'

const patterns = [':act*', ':pfc*', ':memory*', ':polywise*'].map(item => path.join(process.cwd(), item))

for (const pattern of patterns) {
	const files = globSync(pattern)

	for (const file of files) {
		if (fs.pathExistsSync(file)) {
			try {
				fs.removeSync(file)
			} catch (error) {
				console.error(`Failed to remove ${file}:`, error)
			}
		}
	}
}
