import os from 'os'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'
import fs from 'fs-extra'

import { DEFAULT_EMBEDDING_CONFIG } from '../src/consts'
import Pipeline from '../src/Pipeline'
import { generateModelHash, verifyModel } from '../src/utils'

describe('Model Hash Verification', () => {
	let pipeline: Pipeline
	const temp_cache_dir = path.join(os.tmpdir(), `polywise-test-models-${Date.now()}`)

	beforeAll(async () => {
		pipeline = new Pipeline()

		await pipeline.init({
			cache_dir: temp_cache_dir,
			embedding_config: { ...DEFAULT_EMBEDDING_CONFIG }
		})
	})

	afterAll(async () => {
		await fs.remove(temp_cache_dir)
	})

	it('should generate hash.json for a model directory', async () => {
		const model_name = DEFAULT_EMBEDDING_CONFIG.model
		const model_path = path.join(temp_cache_dir, model_name)

		await fs.ensureDir(model_path)
		await fs.writeFile(path.join(model_path, 'config.json'), '{}')
		await fs.writeFile(path.join(model_path, 'model.onnx'), 'dummy content')

		await generateModelHash(model_path)

		const hash_file = path.join(model_path, 'hash.json')
		expect(await fs.pathExists(hash_file)).toBe(true)

		const hash_data = await fs.readJson(hash_file)
		expect(hash_data.hashes).not.toHaveProperty('config.json')
		expect(hash_data.hashes).toHaveProperty('model.onnx')
	})

	it('should verify model integrity when files are valid', async () => {
		const model_name = DEFAULT_EMBEDDING_CONFIG.model
		const model_path = path.join(temp_cache_dir, model_name)

		const is_valid = await verifyModel(model_path)
		expect(is_valid).toBe(true)
	})

	it('should fail verification when an onnx file is modified', async () => {
		const model_name = DEFAULT_EMBEDDING_CONFIG.model
		const model_path = path.join(temp_cache_dir, model_name)

		await fs.writeFile(path.join(model_path, 'model.onnx'), 'modified content')

		const is_valid = await verifyModel(model_path)
		expect(is_valid).toBe(false)
	})

	it('should still pass verification when a non-onnx file is modified', async () => {
		const model_name = DEFAULT_EMBEDDING_CONFIG.model
		const model_path = path.join(temp_cache_dir, model_name)

		// Restore model.onnx and regenerate hash
		await fs.writeFile(path.join(model_path, 'model.onnx'), 'dummy content')
		await generateModelHash(model_path)

		// Modify non-onnx file
		await fs.writeFile(path.join(model_path, 'config.json'), '{"modified": true}')

		const is_valid = await verifyModel(model_path)
		expect(is_valid).toBe(true)
	})

	it('should fail verification when an onnx file is missing', async () => {
		const model_name = DEFAULT_EMBEDDING_CONFIG.model
		const model_path = path.join(temp_cache_dir, model_name)

		await fs.remove(path.join(model_path, 'model.onnx'))

		const is_valid = await verifyModel(model_path)
		expect(is_valid).toBe(false)
	})

	it('should detect when hash.json itself is missing', async () => {
		const model_name = DEFAULT_EMBEDDING_CONFIG.model
		const model_path = path.join(temp_cache_dir, model_name)

		await fs.remove(path.join(model_path, 'hash.json'))

		const is_valid = await verifyModel(model_path)
		expect(is_valid).toBe(false)
	})
})
