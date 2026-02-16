import path from 'path'
import fs from 'fs-extra'

import generateHash from './generateHash'
import listRecursive from './listRecursive'

export default async (model_path: string) => {
	const files = await listRecursive(model_path)
	const hashes: Record<string, string> = {}

	for (const file of files) {
		if (!file.endsWith('.onnx')) continue

		const relative_path = path.relative(model_path, file)
		const hash = await generateHash(file)

		if (hash) {
			hashes[relative_path] = hash
		}
	}

	await fs.writeJson(path.join(model_path, 'hash.json'), { hashes }, { spaces: 2 })
}
