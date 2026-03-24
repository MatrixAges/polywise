import { join } from 'path'
import fs from 'fs-extra'
import { combineModelDownloaders, createModelDownloader, readGgufFileInfo } from 'node-llama-cpp'

import { progress } from './index'

import type { Llama } from 'node-llama-cpp'
import type { LocalModelType } from './index'

interface ModelConfig {
	llama: Llama
	type: LocalModelType
	model_uri: string
	dir_path: string
	file_name: string
}

export default async (config: ModelConfig) => {
	const { llama, type, model_uri, dir_path, file_name } = config
	const file_path = join(dir_path, file_name)

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

	const combile_downloader = await combineModelDownloaders([downloader], {
		showCliProgress: true,
		onProgress(status) {
			const { totalSize, downloadedSize } = status

			progress[type] = {
				total: totalSize,
				downloaded: downloadedSize,
				percent: parseFloat((downloadedSize / totalSize).toFixed(2))
			}
		}
	})

	const [downloaded_path] = await combile_downloader.download()

	progress[type] = {
		total: progress[type]!.total,
		downloaded: progress[type]!.total,
		percent: 100
	}

	console.log('🚀 Download complete.')

	return llama.loadModel({ modelPath: downloaded_path })
}
