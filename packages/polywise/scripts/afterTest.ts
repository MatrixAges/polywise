import { resolve } from 'node:path'
import fs from 'fs-extra'

export default () => {
	try {
		fs.removeSync(resolve(`${process.cwd()}/.test_db`))
	} catch (error) {
		console.error(`Failed to remove clean:`, error)
	}
}
