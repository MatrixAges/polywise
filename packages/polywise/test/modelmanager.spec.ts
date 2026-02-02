import 'reflect-metadata'

import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { DEFAULT_EMBEDDING_MODEL, DEFAULT_RERANKER_MODEL } from '../src/consts'
import ModelManager from '../src/ModelManager'

describe('ModelManager', () => {
	let modelManager: ModelManager
	let testModelsDir: string

	beforeAll(async () => {
		testModelsDir = path.join(os.tmpdir(), `polywise_model_test_${Date.now()}`)
		modelManager = new ModelManager({ models_dir: testModelsDir })
		await modelManager.init()
	}, 30000)

	afterAll(async () => {
		await modelManager.off()
		if (await fs.pathExists(testModelsDir)) {
			await fs.remove(testModelsDir)
		}
	}, 30000)

	describe('ensureDefaultModels', () => {
		it('should install default embedding and reranker models with valid ONNX files', async () => {
			const result = await modelManager.ensureDefaultModels()

			expect(result.embedding_model).toBe(DEFAULT_EMBEDDING_MODEL)
			expect(result.reranker_model).toBe(DEFAULT_RERANKER_MODEL)

			const embedding_model = await modelManager.getModel(DEFAULT_EMBEDDING_MODEL)
			const reranker_model = await modelManager.getModel(DEFAULT_RERANKER_MODEL)

			expect(embedding_model).not.toBeNull()
			expect(embedding_model?.status).toBe('available')
			expect(embedding_model?.size).toBeGreaterThan(0)

			expect(reranker_model).not.toBeNull()
			expect(reranker_model?.status).toBe('available')
			expect(reranker_model?.size).toBeGreaterThan(0)

			const embedding_path = embedding_model?.path || ''
			const reranker_path = reranker_model?.path || ''

			const embedding_onnx_exists = await fs.pathExists(
				path.join(embedding_path, 'onnx', 'model_quantized.onnx')
			)
			const reranker_onnx_exists = await fs.pathExists(
				path.join(reranker_path, 'onnx', 'model_quantized.onnx')
			)

			expect(embedding_onnx_exists).toBe(true)
			expect(reranker_onnx_exists).toBe(true)

			const embedding_onnx_valid = await modelManager.isOnnxModelValid(embedding_path)
			const reranker_onnx_valid = await modelManager.isOnnxModelValid(reranker_path)

			expect(embedding_onnx_valid).toBe(true)
			expect(reranker_onnx_valid).toBe(true)
		}, 600000)

		it('should not re-download if models already available', async () => {
			await modelManager.ensureDefaultModels()

			await modelManager.ensureDefaultModels()

			const embedding_model = await modelManager.getModel(DEFAULT_EMBEDDING_MODEL)
			const reranker_model = await modelManager.getModel(DEFAULT_RERANKER_MODEL)

			expect(embedding_model?.status).toBe('available')
			expect(reranker_model?.status).toBe('available')
		}, 60000)
	})

	describe('reinstallModel', () => {
		it('should delete and re-download model when requested', async () => {
			await modelManager.downloadModel(DEFAULT_EMBEDDING_MODEL)

			const model_before = await modelManager.getModel(DEFAULT_EMBEDDING_MODEL)
			const size_before = model_before?.size || 0

			const reinstalled_model = await modelManager.reinstallModel(DEFAULT_EMBEDDING_MODEL)

			expect(reinstalled_model.status).toBe('available')
			expect(reinstalled_model.size).toBeGreaterThan(0)

			if (size_before > 0) {
				expect(reinstalled_model.size).toBe(size_before)
			}

			const onnx_valid = await modelManager.isOnnxModelValid(reinstalled_model.path)
			expect(onnx_valid).toBe(true)
		}, 600000)
	})
})
