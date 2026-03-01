import crypto from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'

import Pipeline from '../../src/Pipeline'

const CACHE_DIR = path.resolve(__dirname, '../../.test_vectors')
const CACHE_RERANK_DIR = path.resolve(__dirname, '../../.test_vectors/rerank')
const CACHE_KEYWORD_DIR = path.resolve(__dirname, '../../.test_vectors/keywords')

const memory_vector_cache = new Map<string, Array<number>>()
const memory_rerank_cache = new Map<string, Array<{ score: number }>>()
const memory_keyword_cache = new Map<string, Array<string>>()

let pipeline: Pipeline | null = null

const getPipeline = async () => {
	if (!pipeline) {
		pipeline = new Pipeline()

		await pipeline.init({
			cache_dir: path.join(os.homedir(), '.polywise', '.models')
		})
	}

	return pipeline
}

const executeWithCache = async <T>(
	content: string,
	dir: string,
	mem_cache: Map<string, T>,
	exec: (pipeline: Pipeline) => Promise<T>,
	decode?: (data: unknown) => T
) => {
	const hash = crypto.createHash('sha256').update(content).digest('hex')

	if (mem_cache.has(hash)) {
		return mem_cache.get(hash)!
	}

	const cache_path = path.join(dir, `${hash}.json`)

	if (existsSync(cache_path)) {
		const raw_result: unknown = JSON.parse(readFileSync(cache_path, 'utf-8'))
		const result = decode ? decode(raw_result) : (raw_result as T)

		mem_cache.set(hash, result)

		return result
	}

	const pipeline = await getPipeline()
	const result = await exec(pipeline)

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	writeFileSync(cache_path, JSON.stringify(result))

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

const normalizeKeywords = (data: unknown) => {
	if (Array.isArray(data)) {
		return data.map(String)
	}
	return []
}

export const getTestKeywords = async (text: string) => {
	return executeWithCache(
		text,
		CACHE_KEYWORD_DIR,
		memory_keyword_cache,
		async () => {
			const words = text
				.toLowerCase()
				.split(/\W+/)
				.filter(w => w.length > 4 && isNaN(Number(w)))

			const uniqueWords = Array.from(new Set(words)).sort((a, b) => b.length - a.length)
			return uniqueWords.slice(0, 40)
		},
		normalizeKeywords
	)
}
