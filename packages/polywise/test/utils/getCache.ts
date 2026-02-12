import crypto from 'crypto'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import Pipeline from '../../src/Pipeline'

const CACHE_DIR = path.resolve(__dirname, '../../.test_vectors')
const CACHE_RERANK_DIR = path.resolve(__dirname, '../../.test_vectors/rerank')
const CACHE_DECISION_DIR = path.resolve(__dirname, '../../.test_vectors/decision')

const memory_vector_cache = new Map<string, Array<number>>()
const memory_rerank_cache = new Map<string, any>()
const memory_decision_cache = new Map<string, string>()

let rawPipeline: Pipeline | null = null

async function getPipeline() {
	if (!rawPipeline) {
		rawPipeline = new Pipeline()

		await rawPipeline.init({
			cache_dir: path.join(os.homedir(), '.polywise', '.models'),
			embedding_concurrency: 20,
			reranker_concurrency: 20,
			decision_concurrency: 10
		})
	}

	return rawPipeline
}

export async function getTestVectors(text: string) {
	const hash = crypto.createHash('sha256').update(text).digest('hex')

	if (memory_vector_cache.has(hash)) {
		return memory_vector_cache.get(hash)
	}

	const cache_path = path.join(CACHE_DIR, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		const vector = fs.readJsonSync(cache_path)
		memory_vector_cache.set(hash, vector)
		return vector
	}

	const pipeline = await getPipeline()
	const vector = (await pipeline.embed(text)) as Array<number>

	fs.ensureDirSync(CACHE_DIR)
	fs.writeJsonSync(cache_path, vector)
	memory_vector_cache.set(hash, vector)

	return vector
}

export async function getTestRerank(query: string, documents: Array<string>) {
	const content = JSON.stringify({ query, documents })
	const hash = crypto.createHash('sha256').update(content).digest('hex')

	if (memory_rerank_cache.has(hash)) {
		return memory_rerank_cache.get(hash)
	}

	const cache_path = path.join(CACHE_RERANK_DIR, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		const result = fs.readJsonSync(cache_path)
		memory_rerank_cache.set(hash, result)
		return result
	}

	const pipeline = await getPipeline()
	const result = await pipeline.rerank(query, documents)

	fs.ensureDirSync(CACHE_RERANK_DIR)
	fs.writeJsonSync(cache_path, result)
	memory_rerank_cache.set(hash, result)

	return result
}

export async function getTestDecision(prompt: string, options: any) {
	const content = JSON.stringify({ prompt, options })
	const hash = crypto.createHash('sha256').update(content).digest('hex')

	if (memory_decision_cache.has(hash)) {
		return memory_decision_cache.get(hash)
	}

	const cache_path = path.join(CACHE_DECISION_DIR, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		const result = fs.readJsonSync(cache_path)
		memory_decision_cache.set(hash, result)
		return result
	}

	const pipeline = await getPipeline()
	const result = await pipeline.decide(prompt, options)

	fs.ensureDirSync(CACHE_DECISION_DIR)
	fs.writeJsonSync(cache_path, result)
	memory_decision_cache.set(hash, result)

	return result
}
