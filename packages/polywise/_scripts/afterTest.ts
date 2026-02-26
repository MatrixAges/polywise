import { rmSync } from 'fs'
import { resolve } from 'path'

export default () => {
	try {
		rmSync(resolve(`${process.cwd()}/.test_db`), { recursive: true, force: true })
	} catch (error) {
		console.error(`Failed to remove clean:`, error)
	}
}
