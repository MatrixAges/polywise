import crypto from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'

import Pipeline from '../../src/Pipeline'

import type { Triple } from '../../src/types'

const CACHE_DIR = path.resolve(__dirname, '../../.test_vectors')
const CACHE_RERANK_DIR = path.resolve(__dirname, '../../.test_vectors/rerank')
const CACHE_TRIPLE_DIR = path.resolve(__dirname, '../../.test_vectors/triples')

const memory_vector_cache = new Map<string, Array<number>>()
const memory_rerank_cache = new Map<string, Array<{ index: number; score: number }>>()
const memory_triple_cache = new Map<string, Array<Triple>>()

let pipeline: Pipeline | null = null

const getPipeline = async () => {
	if (!pipeline) {
		pipeline = new Pipeline()

		await pipeline.init({
			cache_dir: path.join(os.homedir(), '.polywise', '.models'),
			embedding_concurrency: 20,
			reranker_concurrency: 20,
			rebel_concurrency: 20
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

const normalizeTriple = (data: unknown) => {
	if (!data || typeof data !== 'object') {
		return null
	}

	const triple_data = data as {
		subject?: unknown
		predicate?: unknown
		object?: unknown
		learning_rate?: unknown
		decay_resistance?: unknown
		metadata?: unknown
	}

	const subject = String(triple_data.subject ?? '').trim()
	const predicate = String(triple_data.predicate ?? '').trim()
	const object = String(triple_data.object ?? '').trim()

	if (!subject || !predicate || !object) {
		return null
	}

	const learning_rate_candidate = Number(triple_data.learning_rate)
	const decay_resistance_candidate = Number(triple_data.decay_resistance)

	return {
		subject,
		predicate,
		object,
		learning_rate: Number.isFinite(learning_rate_candidate) ? learning_rate_candidate : 1.0,
		decay_resistance: Number.isFinite(decay_resistance_candidate) ? decay_resistance_candidate : 1.0,
		metadata: triple_data.metadata && typeof triple_data.metadata === 'object' ? triple_data.metadata : {}
	}
}

const normalizeTriples = (data: unknown) => {
	if (Array.isArray(data)) {
		return data.map(item => normalizeTriple(item)).filter((item): item is Triple => item !== null)
	}

	const single_triple = normalizeTriple(data)

	if (!single_triple) {
		return []
	}

	return [single_triple]
}

export const getTestTriples = async (text: string) => {
	return executeWithCache(
		text,
		CACHE_TRIPLE_DIR,
		memory_triple_cache,
		async p => {
			const triples = await p.extractTriples(text)

			return normalizeTriples(triples)
		},
		normalizeTriples
	)
}
