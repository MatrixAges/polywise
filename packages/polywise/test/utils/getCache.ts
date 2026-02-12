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

let pipeline: Pipeline | null = null

const getPipeline = async () => {
	if (!pipeline) {
		pipeline = new Pipeline()

		await pipeline.init({
			cache_dir: path.join(os.homedir(), '.polywise', '.models'),
			embedding_concurrency: 20,
			reranker_concurrency: 20,
			decision_concurrency: 10
		})
	}

	return pipeline
}

const executeWithCache = async <T>(
	content: string,
	dir: string,
	mem_cache: Map<string, T>,
	exec: (pipeline: Pipeline) => Promise<T>
) => {
	const hash = crypto.createHash('sha256').update(content).digest('hex')

	if (mem_cache.has(hash)) {
		return mem_cache.get(hash)!
	}

	const cache_path = path.join(dir, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		const result = fs.readJsonSync(cache_path)

		mem_cache.set(hash, result)

		return result
	}

	const pipeline = await getPipeline()
	const result = await exec(pipeline)

	fs.ensureDirSync(dir)
	fs.writeJsonSync(cache_path, result)

	mem_cache.set(hash, result)

	return result
}

export const getTestVectors = async (text: string) => {
	return executeWithCache(text, CACHE_DIR, memory_vector_cache, async p => {
		return (await p.embed(text)) as Array<number>
	})
}

export const getTestRerank = async (query: string, documents: Array<string>) => {
	return executeWithCache(JSON.stringify({ query, documents }), CACHE_RERANK_DIR, memory_rerank_cache, async p => {
		return await p.rerank(query, documents)
	})
}

export const getTestDecision = async (prompt: string, options: any) => {
	return executeWithCache(
		JSON.stringify({ prompt, options }),
		CACHE_DECISION_DIR,
		memory_decision_cache,
		async p => {
			return await p.decide(prompt, options)
		}
	)
}
