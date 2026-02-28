import path from 'path'
import { pathExists, readJson } from 'fs-extra'

import generateHash from './generateHash'
import listRecursive from './listFiles'

export default async (model_path: string) => {
	const hash_file = path.join(model_path, 'hash.json')

	if (!(await pathExists(hash_file))) return false

	const { hashes } = await readJson(hash_file)
	const files = await listRecursive(model_path)
	const onnx_files = files.filter(file => file.endsWith('.onnx'))

	if (onnx_files.length !== Object.keys(hashes).length) return false

	for (const file of onnx_files) {
		const relative_path = path.relative(model_path, file)
		const current_hash = await generateHash(file)

		if (current_hash !== hashes[relative_path]) return false
	}

	return true
}
