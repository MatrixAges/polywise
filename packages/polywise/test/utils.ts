import * as fs from 'node:fs'
import * as path from 'node:path'
import { globSync } from 'glob'

export const cleanupTestDatabases = () => {
	const patterns = [
		path.join(process.cwd(), ':polywise_*'),
		path.join(process.cwd(), 'packages/polywise/:polywise_*')
	]

	for (const pattern of patterns) {
		const files = globSync(pattern)

		for (const file of files) {
			if (fs.existsSync(file)) {
				try {
					if (fs.statSync(file).isDirectory()) {
						fs.rmSync(file, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
					} else {
						fs.unlinkSync(file)
					}
				} catch (error) {
					// Ignore errors if the file is already gone or busy
				}
			}
		}
	}
}
