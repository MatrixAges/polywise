import { randomBytes } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default () => {
	const dir = resolve(`${process.cwd()}/.test_db`)

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	return resolve(dir, randomBytes(6).toString('hex'))
}
