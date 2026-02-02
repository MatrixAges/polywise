import { injectable } from 'tsyringe'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { DEFAULT_DTYPE } from './consts'

import type { ModelStatus, LocalModel, ModelDownloadProgress, ModelManagerArgs, DownloadOptions } from './types/model'

@injectable()
export default class ModelManager {
	private models_dir: string
	private default_dtype: string
	private models: Map<string, LocalModel> = new Map()
	private download_progress: Map<string, ModelDownloadProgress> = new Map()
	private downloads_dir: string

	constructor(args?: ModelManagerArgs) {
		this.default_dtype = args?.default_dtype || DEFAULT_DTYPE
		this.models_dir = args?.models_dir || path.join(os.homedir(), '.Models')
		this.downloads_dir = path.join(this.models_dir, '.downloads')
	}

	async init() {
		await fs.ensureDir(this.models_dir)
		await fs.ensureDir(this.downloads_dir)
		await this.scanLocalModels()
		return this
	}

	async scanLocalModels() {
		this.models.clear()

		if (!(await fs.pathExists(this.models_dir))) {
			return
		}

		const entries = await fs.readdir(this.models_dir, { withFileTypes: true })

		for (const entry of entries) {
			if (!entry.isDirectory() || entry.name.startsWith('.')) {
				continue
			}

			const modelPath = path.join(this.models_dir, entry.name)
			const model = await this.verifyModel完整性(entry.name, modelPath)

			this.models.set(entry.name, model)
		}
	}

	async verifyModel完整性(model_id: string, modelPath?: string): Promise<LocalModel> {
		const actualPath = modelPath || path.join(this.models_dir, model_id)

		if (!(await fs.pathExists(actualPath))) {
			const existing = this.models.get(model_id)
			if (existing) {
				existing.status = 'incomplete'
				existing.last_checked = new Date().toISOString()
				return existing
			}
			return {
				id: model_id,
				name: model_id,
				path: actualPath,
				size: 0,
				status: 'incomplete',
				last_checked: new Date().toISOString()
			}
		}

		const modelJsonPath = path.join(actualPath, 'model.json')
		const configPath = path.join(actualPath, 'config.json')
		const hasModelJson = await fs.pathExists(modelJsonPath)
		const hasConfig = await fs.pathExists(configPath)

		let size = 0
		try {
			size = await this.folderSize(actualPath)
		} catch {
			size = 0
		}

		const isValid = hasModelJson || hasConfig
		const status: ModelStatus = isValid ? 'available' : 'incomplete'

		const existing = this.models.get(model_id)
		const model: LocalModel = {
			id: model_id,
			name: model_id,
			path: actualPath,
			size,
			status,
			last_checked: new Date().toISOString(),
			dtype: existing?.dtype
		}

		this.models.set(model_id, model)
		return model
	}

	private async folderSize(dirPath: string): Promise<number> {
		if (!(await fs.pathExists(dirPath))) {
			return 0
		}

		const entries = await fs.readdir(dirPath, { withFileTypes: true })
		let totalSize = 0

		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name)
			if (entry.isDirectory()) {
				totalSize += await this.folderSize(fullPath)
			} else {
				const stats = await fs.stat(fullPath)
				totalSize += stats.size
			}
		}

		return totalSize
	}

	async listModels(): Promise<LocalModel[]> {
		return Array.from(this.models.values())
	}

	async getModel(model_id: string): Promise<LocalModel | null> {
		return this.models.get(model_id) || null
	}

	async getModelStatus(model_id: string): Promise<ModelStatus | null> {
		const model = await this.getModel(model_id)
		return model?.status || null
	}

	setModelsDir(dir: string) {
		this.models_dir = dir
		this.downloads_dir = path.join(this.models_dir, '.downloads')
	}

	getModelsDir(): string {
		return this.models_dir
	}

	async downloadModel(model_id: string, options?: DownloadOptions): Promise<LocalModel> {
		const existingModel = this.models.get(model_id)
		if (existingModel?.status === 'downloading') {
			return existingModel
		}

		const dtype = options?.dtype || this.default_dtype
		const modelPath = path.join(this.models_dir, model_id)

		const progress: ModelDownloadProgress = {
			model_id,
			downloaded: 0,
			total: 0,
			speed: 0,
			status: 'downloading'
		}

		this.download_progress.set(model_id, progress)
		this.models.set(model_id, {
			id: model_id,
			name: model_id,
			path: modelPath,
			size: 0,
			status: 'downloading'
		})

		try {
			await fs.ensureDir(this.downloads_dir)

			const repoId = model_id
			const commitHash = options?.revision || 'main'

			const files = ['model.json', 'config.json', 'tokenizer.json', 'tokenizer_config.json']

			const cacheDir = path.join(this.downloads_dir, `${repoId}_${commitHash}`)
			await fs.ensureDir(cacheDir)

			let totalSize = 0

			for (const fileName of files) {
				const url = `https://huggingface.co/${repoId}/resolve/${commitHash}/${fileName}`
				const filePath = path.join(cacheDir, fileName)

				try {
					const fileSize = await this.downloadFile(
						url,
						filePath,
						progress,
						options?.progress_callback
					)
					totalSize += fileSize
				} catch (error) {
					console.warn(`Failed to download ${fileName}:`, error)
				}
			}

			const safetensorsUrl = `https://huggingface.co/${repoId}/resolve/${commitHash}/model.safetensors`
			const safetensorsPath = path.join(cacheDir, 'model.safetensors')

			try {
				const safetensorsSize = await this.downloadFile(
					safetensorsUrl,
					safetensorsPath,
					progress,
					options?.progress_callback
				)
				totalSize += safetensorsSize
			} catch {
				console.warn('Safetensors file not found or failed to download')
			}

			progress.total = totalSize
			progress.downloaded = totalSize
			progress.status = 'completed'

			if (await fs.pathExists(cacheDir)) {
				await fs.copy(cacheDir, modelPath)
			}

			const model = await this.verifyModel完整性(model_id, modelPath)
			model.dtype = dtype

			return model
		} catch (error) {
			progress.status = 'failed'
			progress.error = error instanceof Error ? error.message : String(error)

			this.models.set(model_id, {
				id: model_id,
				name: model_id,
				path: modelPath,
				size: 0,
				status: 'error',
				error: progress.error
			})

			throw error
		} finally {
			this.download_progress.delete(model_id)
		}
	}

	private async downloadFile(
		url: string,
		destPath: string,
		progress: ModelDownloadProgress,
		callback?: (p: ModelDownloadProgress) => void
	): Promise<number> {
		const destDir = path.dirname(destPath)
		await fs.ensureDir(destDir)

		const response = await fetch(url, {
			method: 'GET',
			headers: {}
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		const contentLength = response.headers.get('content-length')
		const totalSize = contentLength ? parseInt(contentLength, 10) : 0

		if (totalSize > 0) {
			progress.total += totalSize
		}

		const fileStream = fs.createWriteStream(destPath)
		const reader = response.body?.getReader()

		if (!reader) {
			fileStream.close()
			throw new Error('Response body is null')
		}

		let downloaded = 0

		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				break
			}

			fileStream.write(value)
			downloaded += value.length
			progress.downloaded += value.length

			if (totalSize > 0) {
				progress.speed = downloaded / 1000
			}

			callback?.(progress)
		}

		fileStream.end()

		return downloaded
	}

	async deleteModel(model_id: string): Promise<boolean> {
		const model = this.models.get(model_id)
		if (!model) {
			return false
		}

		const modelPath = model.path
		const downloadsPath = path.join(this.downloads_dir, model_id)

		try {
			if (await fs.pathExists(modelPath)) {
				await fs.remove(modelPath)
			}
			if (await fs.pathExists(downloadsPath)) {
				await fs.remove(downloadsPath)
			}

			this.models.delete(model_id)
			this.download_progress.delete(model_id)

			return true
		} catch (error) {
			console.error(`Failed to delete model ${model_id}:`, error)
			return false
		}
	}

	async getDownloadProgress(model_id: string): Promise<ModelDownloadProgress | null> {
		return this.download_progress.get(model_id) || null
	}

	async refreshModelStatus(model_id: string): Promise<LocalModel> {
		return this.verifyModel完整性(model_id)
	}

	async getModelSize(model_id: string): Promise<number> {
		const model = await this.getModel(model_id)
		return model?.size || 0
	}

	off() {
		this.models.clear()
		this.download_progress.clear()
	}
}
