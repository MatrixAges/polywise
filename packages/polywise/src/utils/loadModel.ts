import path from 'path'
import fs from 'fs-extra'
import { createModelDownloader, readGgufFileInfo } from 'node-llama-cpp'

import type { Llama } from 'node-llama-cpp'

interface ModelConfig {
	llama: Llama
	model_uri: string
	dir_path: string
	file_name: string
}

export default async (config: ModelConfig) => {
	const { llama, model_uri, dir_path, file_name } = config
	const file_path = path.join(dir_path, file_name)

	const exsit = await fs.pathExists(file_path)

	if (exsit) {
		try {
			console.log('Checking local model...')

			await readGgufFileInfo(file_path)

			console.log('✅ Verification passed.')

			return llama.loadModel({ modelPath: file_path })
		} catch (err) {
			console.warn(`❌ Model invalid: ${(err as Error).message}. Cleaning up...`)

			await fs.remove(file_path)
		}
	}

	console.log('⚠️ Model missing or broken, starting download...')

	await fs.ensureDir(dir_path)

	const downloader = await createModelDownloader({
		modelUri: model_uri,
		dirPath: dir_path
	})

	const downloaded_path = await downloader.download()

	console.log('🚀 Download complete.')

	return llama.loadModel({ modelPath: downloaded_path })
}
