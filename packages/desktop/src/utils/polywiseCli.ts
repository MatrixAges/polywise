import { existsSync } from 'fs'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'

const require = createRequire(import.meta.url)

const getCandidateCliPaths = () => {
	const candidates = [] as Array<string>

	try {
		const polywise_package_json = require.resolve('polywise/package.json')
		candidates.push(resolve(dirname(polywise_package_json), 'dist/cli.js'))
	} catch {}

	candidates.push(resolve(__dirname, '../../../polywise/dist/cli.js'))
	candidates.push(resolve(process.cwd(), 'packages/polywise/dist/cli.js'))

	return candidates
}

export const resolvePolywiseCliPath = () => {
	const file_path = getCandidateCliPaths().find(path => existsSync(path))

	if (!file_path) {
		throw new Error('Polywise CLI entry was not found. Build packages/polywise first.')
	}

	return file_path
}

export const getPolywiseForkTarget = (args: Array<string> = []) => ({
	module_path: resolvePolywiseCliPath(),
	args
})
