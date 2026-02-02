import { injectable } from 'tsyringe'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { listFiles, downloadFile } from '@huggingface/hub'
import { DEFAULT_DTYPE, DEFAULT_EMBEDDING_MODEL, DEFAULT_RERANKER_MODEL } from './consts'

import type { ModelStatus, LocalModel, ModelDownloadProgress, ModelManagerArgs, DownloadOptions } from './types/model'

const ONNX_FILE_MAP: Record<string, string> = {
	q8: 'onnx/model_quantized.onnx',
	q4: 'onnx/model_q4.onnx',
	fp16: 'onnx/model_fp16.onnx',
	int8: 'onnx/model_int8.onnx',
	fp32: 'onnx/model.onnx'
}

function getOnnxFileByDtype(dtype?: string): string {
	return ONNX_FILE_MAP[dtype || DEFAULT_DTYPE] || ONNX_FILE_MAP.q8
}

function shouldDownloadFile(filePath: string, dtype?: string): boolean {
	if (filePath.endsWith('.json') || filePath.endsWith('.txt') || filePath.endsWith('.md')) {
		return true
	}

	if (!filePath.endsWith('.onnx')) {
		return false
	}

	if (!filePath.startsWith('onnx/')) {
		return false
	}

	const targetOnnxFile = getOnnxFileByDtype(dtype)

	if (filePath === targetOnnxFile) {
		return true
	}

	return false
}

async function downloadModelFromHub(
	repo: string,
	localDir: string,
	options?: {
		revision?: string
		dtype?: string
		onProgress?: (progress: { downloadedBytes: number; totalBytes: number }) => void
	}
) {
	await fs.ensureDir(localDir)

	const files: Array<{ path: string; size: number }> = []
	let totalBytes = 0

	for await (const file of listFiles({ repo: { type: 'model', name: repo }, recursive: true })) {
		if (file.type !== 'file') continue

		if (shouldDownloadFile(file.path, options?.dtype)) {
			files.push({ path: file.path, size: file.size })
			totalBytes += file.size
		}
	}

	let downloadedBytes = 0

	for (const file of files) {
		const filePath = path.join(localDir, file.path)
		await fs.ensureDir(path.dirname(filePath))

		const response = await downloadFile({
			repo: { type: 'model', name: repo },
			path: file.path,
			revision: options?.revision || 'main'
		})

		if (!response) {
			throw new Error(`Failed to download file: ${file.path}`)
		}

		const buffer = await response.arrayBuffer()
		await fs.writeFile(filePath, Buffer.from(buffer))

		downloadedBytes += file.size
		options?.onProgress?.({ downloadedBytes, totalBytes })
	}
}

@injectable()
export default class ModelManager {
	private models_dir: string
	private default_dtype: string
	private models: Map<string, LocalModel> = new Map()
	private download_progress: Map<string, ModelDownloadProgress> = new Map()

	constructor(args?: ModelManagerArgs) {
		this.default_dtype = args?.default_dtype || DEFAULT_DTYPE
		this.models_dir = args?.models_dir || path.join(os.homedir(), '.Models')
	}

	async init() {
		await fs.ensureDir(this.models_dir)
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

			const model_path = path.join(this.models_dir, entry.name)
			const model = await this.verifyModelIntegrity(entry.name, model_path, this.default_dtype)

			this.models.set(entry.name, model)
		}
	}

	async verifyModelIntegrity(model_id: string, model_path?: string, dtype?: string): Promise<LocalModel> {
		const actual_path = model_path || path.join(this.models_dir, model_id)

		if (!(await fs.pathExists(actual_path))) {
			const existing = this.models.get(model_id)
			if (existing) {
				existing.status = 'incomplete'
				existing.last_checked = new Date().toISOString()
				return existing
			}
			return {
				id: model_id,
				name: model_id,
				path: actual_path,
				size: 0,
				status: 'incomplete',
				last_checked: new Date().toISOString()
			}
		}

		const size = await this.calculateFolderSize(actual_path)

		const is_valid = await this.isOnnxModelValid(actual_path, dtype)
		const status: ModelStatus = is_valid ? 'available' : 'incomplete'

		const existing = this.models.get(model_id)
		const model: LocalModel = {
			id: model_id,
			name: model_id,
			path: actual_path,
			size,
			status,
			last_checked: new Date().toISOString(),
			dtype: existing?.dtype || dtype
		}

		this.models.set(model_id, model)
		return model
	}

	async isOnnxModelValid(model_path: string, dtype?: string): Promise<boolean> {
		const onnx_dir = path.join(model_path, 'onnx')

		if (!(await fs.pathExists(onnx_dir))) {
			return false
		}

		const target_onnx = getOnnxFileByDtype(dtype)
		const target_path = path.join(model_path, target_onnx)

		if (await fs.pathExists(target_path)) {
			const stats = await fs.stat(target_path)
			return stats.size > 1000000
		}

		const fallback_files = [
			'onnx/model_quantized.onnx',
			'onnx/model.onnx',
			'onnx/model_int8.onnx',
			'onnx/model_fp16.onnx',
			'onnx/model_q4.onnx'
		]

		for (const file of fallback_files) {
			if (await fs.pathExists(path.join(model_path, file))) {
				const stats = await fs.stat(path.join(model_path, file))
				if (stats.size > 1000000) {
					return true
				}
			}
		}

		return false
	}

	async calculateFolderSize(dir_path: string): Promise<number> {
		if (!(await fs.pathExists(dir_path))) {
			return 0
		}

		const entries = await fs.readdir(dir_path, { withFileTypes: true })
		let total_size = 0

		for (const entry of entries) {
			const full_path = path.join(dir_path, entry.name)
			if (entry.isDirectory()) {
				total_size += await this.calculateFolderSize(full_path)
			} else {
				const stats = await fs.stat(full_path)
				total_size += stats.size
			}
		}

		return total_size
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
	}

	getModelsDir(): string {
		return this.models_dir
	}

	async downloadModel(model_id: string, options?: DownloadOptions): Promise<LocalModel> {
		const existing_model = this.models.get(model_id)
		if (existing_model?.status === 'downloading') {
			return existing_model
		}

		const dtype = options?.dtype || this.default_dtype
		const model_path = path.join(this.models_dir, model_id)

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
			path: model_path,
			size: 0,
			status: 'downloading'
		})

		try {
			console.log(`Downloading model: ${model_id}`)

			await fs.ensureDir(model_path)

			await downloadModelFromHub(model_id, model_path, {
				revision: options?.revision || 'main',
				dtype,
				onProgress: (progress_data: { downloadedBytes: number; totalBytes: number }) => {
					progress.downloaded = progress_data.downloadedBytes
					progress.total = progress_data.totalBytes
					progress.speed = progress_data.totalBytes > 0 ? progress_data.downloadedBytes / 1000 : 0
					options?.progress_callback?.(progress)
				}
			})

			progress.downloaded = progress.total
			progress.status = 'completed'

			const model = await this.verifyModelIntegrity(model_id, model_path, dtype)
			model.dtype = dtype

			if (model.status !== 'available') {
				throw new Error('Downloaded model is incomplete or missing ONNX files')
			}

			return model
		} catch (error) {
			progress.status = 'failed'
			progress.error = error instanceof Error ? error.message : String(error)

			this.models.set(model_id, {
				id: model_id,
				name: model_id,
				path: model_path,
				size: 0,
				status: 'error',
				error: progress.error
			})

			throw error
		} finally {
			this.download_progress.delete(model_id)
		}
	}

	async deleteModel(model_id: string): Promise<boolean> {
		const model = this.models.get(model_id)
		if (!model) {
			return false
		}

		const model_path = model.path

		try {
			if (await fs.pathExists(model_path)) {
				await fs.remove(model_path)
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
		return this.verifyModelIntegrity(model_id)
	}

	async getModelSize(model_id: string): Promise<number> {
		const model = await this.getModel(model_id)
		return model?.size || 0
	}

	off() {
		this.models.clear()
		this.download_progress.clear()
	}

	async ensureDefaultModels() {
		const embedding_model = await this.getModel(DEFAULT_EMBEDDING_MODEL)

		if (!embedding_model || embedding_model.status !== 'available') {
			console.log(`Downloading embedding model: ${DEFAULT_EMBEDDING_MODEL}`)
			await this.downloadModel(DEFAULT_EMBEDDING_MODEL)
		} else {
			console.log(`Embedding model already available: ${DEFAULT_EMBEDDING_MODEL}`)
		}

		const reranker_model = await this.getModel(DEFAULT_RERANKER_MODEL)

		if (!reranker_model || reranker_model.status !== 'available') {
			console.log(`Downloading reranker model: ${DEFAULT_RERANKER_MODEL}`)
			await this.downloadModel(DEFAULT_RERANKER_MODEL)
		} else {
			console.log(`Reranker model already available: ${DEFAULT_RERANKER_MODEL}`)
		}

		return {
			embedding_model: DEFAULT_EMBEDDING_MODEL,
			reranker_model: DEFAULT_RERANKER_MODEL
		}
	}

	async reinstallModel(model_id: string, options?: DownloadOptions): Promise<LocalModel> {
		console.log(`Reinstalling model: ${model_id}`)

		await this.deleteModel(model_id)

		return this.downloadModel(model_id, options)
	}
}
