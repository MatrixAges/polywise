import path from 'path'
import { progress_emmiter } from '@core/rpc/llama/progress'
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

export const verifyLocalModelFile = async (file_path: string) => {
	const exists = await fs.pathExists(file_path)

	if (!exists) return false

	try {
		await readGgufFileInfo(file_path)

		return true
	} catch (err) {
		console.warn(`❌ Model invalid: ${(err as Error).message}. Cleaning up...`)

		await fs.remove(file_path)

		return false
	}
}

export default async (config: ModelConfig, status_only?: boolean) => {
	const { llama, type, model_uri, dir_path, file_name } = config
	const file_path = path.join(dir_path, file_name)

	const exists = await verifyLocalModelFile(file_path)

	if (status_only) return exists

	if (exists) {
		console.log('Checking local model...')
		console.log('✅ Verification passed.')

		return llama.loadModel({ modelPath: file_path })
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
				percent: parseFloat(((downloadedSize * 100) / totalSize).toFixed(2))
			}

			progress_emmiter.emit('change', progress)
		}
	})

	const [downloaded_path] = await combile_downloader.download()

	progress[type] = {
		total: progress[type]!.total,
		downloaded: progress[type]!.total,
		percent: 100
	}

	progress_emmiter.emit('change', progress)

	console.log('🚀 Download complete.')

	return llama.loadModel({ modelPath: downloaded_path })
}
