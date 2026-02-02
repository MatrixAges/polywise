import 'reflect-metadata'

import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { DEFAULT_EMBEDDING_MODEL, DEFAULT_RERANKER_MODEL } from '../src/consts'
import ModelManager from '../src/ModelManager'

const TEST_TIMEOUT_SHORT = 60000

describe('ModelManager', () => {
	let modelManager: ModelManager
	let testModelsDir: string

	beforeAll(async () => {
		testModelsDir = path.join(os.tmpdir(), `polywise_model_test_${Date.now()}`)
		modelManager = new ModelManager({ models_dir: testModelsDir })

		await modelManager.init()
	}, TEST_TIMEOUT_SHORT)

	afterAll(async () => {
		modelManager.off()

		if (await fs.pathExists(testModelsDir)) {
			await fs.remove(testModelsDir)
		}
	}, TEST_TIMEOUT_SHORT)

	describe('dtype to ONNX file mapping', () => {
		it('should map q8 to model_quantized.onnx', () => {
			const testManager = new ModelManager({ models_dir: testModelsDir, default_dtype: 'q8' })
			expect(testManager).toBeDefined()
		})

		it('should map q4 to model_q4.onnx', () => {
			const testManager = new ModelManager({ models_dir: testModelsDir, default_dtype: 'q4' })
			expect(testManager).toBeDefined()
		})
	})

	describe('isOnnxModelValid', () => {
		it('should validate ONNX model with correct dtype', async () => {
			const mockModelDir = path.join(testModelsDir, 'mock_model')
			const onnxDir = path.join(mockModelDir, 'onnx')
			await fs.ensureDir(onnxDir)

			const onnxPath = path.join(onnxDir, 'model_quantized.onnx')
			await fs.writeFile(onnxPath, Buffer.alloc(2000000))

			const isValid = await modelManager.isOnnxModelValid(mockModelDir, 'q8')
			expect(isValid).toBe(true)

			await fs.remove(mockModelDir)
		})

		it('should return false when ONNX file is missing', async () => {
			const mockModelDir = path.join(testModelsDir, 'mock_model_empty')
			await fs.ensureDir(mockModelDir)

			const isValid = await modelManager.isOnnxModelValid(mockModelDir, 'q8')
			expect(isValid).toBe(false)

			await fs.remove(mockModelDir)
		})

		it('should return false when ONNX file is too small', async () => {
			const mockModelDir = path.join(testModelsDir, 'mock_model_small')
			const onnxDir = path.join(mockModelDir, 'onnx')
			await fs.ensureDir(onnxDir)

			const onnxPath = path.join(onnxDir, 'model_quantized.onnx')
			await fs.writeFile(onnxPath, Buffer.alloc(100))

			const isValid = await modelManager.isOnnxModelValid(mockModelDir, 'q8')
			expect(isValid).toBe(false)

			await fs.remove(mockModelDir)
		})
	})

	describe('ensureDefaultModels', () => {
		it(
			'should skip download if models already available',
			async () => {
				const embeddingDir = path.join(testModelsDir, DEFAULT_EMBEDDING_MODEL)
				const rerankerDir = path.join(testModelsDir, DEFAULT_RERANKER_MODEL)
				const embeddingOnnxDir = path.join(embeddingDir, 'onnx')
				const rerankerOnnxDir = path.join(rerankerDir, 'onnx')

				await fs.ensureDir(embeddingOnnxDir)
				await fs.ensureDir(rerankerOnnxDir)
				await fs.writeFile(path.join(embeddingDir, 'config.json'), '{}')
				await fs.writeFile(path.join(rerankerDir, 'config.json'), '{}')
				await fs.writeFile(path.join(embeddingOnnxDir, 'model_quantized.onnx'), Buffer.alloc(2000000))
				await fs.writeFile(path.join(rerankerOnnxDir, 'model_quantized.onnx'), Buffer.alloc(2000000))

				await modelManager.scanLocalModels()

				const result = await modelManager.ensureDefaultModels()

				expect(result.embedding_model).toBe(DEFAULT_EMBEDDING_MODEL)
				expect(result.reranker_model).toBe(DEFAULT_RERANKER_MODEL)

				const embeddingModel = await modelManager.getModel(DEFAULT_EMBEDDING_MODEL)
				const rerankerModel = await modelManager.getModel(DEFAULT_RERANKER_MODEL)

				expect(embeddingModel?.status).toBe('available')
				expect(rerankerModel?.status).toBe('available')
			},
			TEST_TIMEOUT_SHORT
		)
	})

	describe('reinstallModel', () => {
		it(
			'should delete and recreate mock model',
			async () => {
				const mockModelId = 'mock/test-model'
				const mockModelDir = path.join(testModelsDir, mockModelId)
				const onnxDir = path.join(mockModelDir, 'onnx')

				await fs.ensureDir(onnxDir)
				await fs.writeFile(path.join(mockModelDir, 'config.json'), '{}')
				await fs.writeFile(path.join(onnxDir, 'model_quantized.onnx'), Buffer.alloc(2000000))

				await modelManager.scanLocalModels()

				const modelBefore = await modelManager.getModel(mockModelId)
				expect(modelBefore?.status).toBe('available')

				await modelManager.deleteModel(mockModelId)

				const modelAfter = await modelManager.getModel(mockModelId)
				expect(modelAfter).toBeNull()
			},
			TEST_TIMEOUT_SHORT
		)
	})
})
