import { env, pipeline } from '@huggingface/transformers'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import PQueue from 'p-queue'
import { injectable } from 'tsyringe'
import to from 'await-to-js'

import { DEFAULT_EMBEDDING_CONFIG, DEFAULT_RERANKER_CONFIG, POOLING_MEAN, DEFAULT_CONCURRENCY } from './consts'
import { catchError, catchFinally } from './decorators'

import type {
	EmbeddingConfig,
	RerankerConfig,
	PipelineArgs,
	SearchResult,
	SearchCandidate,
	PipelineSearchArgs
} from './types'

@injectable()
@catchError()
export default class Pipeline {
	private embedding_config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG
	private reranker_config: RerankerConfig = DEFAULT_RERANKER_CONFIG
	private cache_dir: string | null = `${os.homedir()}/.polywise/.models`
	private embedding_concurrency: number = DEFAULT_CONCURRENCY
	private reranker_concurrency: number = DEFAULT_CONCURRENCY
	private embedding_pipeline: any = null
	private reranker_pipeline: any = null
	private embedding_queue: PQueue
	private reranker_queue: PQueue
	private embedding_promise: Promise<any> | null = null
	private reranker_promise: Promise<any> | null = null

	constructor() {
		this.embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
		this.reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
	}

	async init(args: PipelineArgs = {}) {
		const { cache_dir, embedding_config, reranker_config, embedding_concurrency, reranker_concurrency } = args

		if (cache_dir) {
			this.cache_dir = cache_dir
		}

		env.cacheDir = this.cache_dir

		if (embedding_config) {
			this.embedding_config = embedding_config
			this.embedding_pipeline = null
		}

		if (reranker_config) {
			this.reranker_config = reranker_config
			this.reranker_pipeline = null
		}

		if (embedding_concurrency !== undefined) {
			this.embedding_concurrency = embedding_concurrency
			this.embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
		}

		if (reranker_concurrency !== undefined) {
			this.reranker_concurrency = reranker_concurrency
			this.reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
		}
	}

	async setEmbeddingConfig(config: EmbeddingConfig) {
		this.embedding_config = config
		this.embedding_pipeline = null

		if (config.type === 'local') {
			await this.loadEmbeddingModel()
		}
	}

	async setRerankerConfig(config: RerankerConfig) {
		this.reranker_config = config
		this.reranker_pipeline = null

		if (config.type === 'local') {
			await this.loadRerankerModel()
		}
	}

	async embed(text: string) {
		return this.embedding_queue.add(async () => {
			if (this.embedding_config.type === 'custom') {
				const { fn } = this.embedding_config

				return await fn(text)
			}

			const embedding = await this.loadEmbeddingModel()

			const output = await embedding(text, {
				pooling: POOLING_MEAN,
				normalize: true,
				truncation: true,
				max_length: 2048
			})

			return Array.from((output as any).data)
		})
	}

	async rerank(query: string, documents: string[]) {
		return this.reranker_queue.add(async () => {
			if (this.reranker_config.type === 'custom') {
				const { fn } = this.reranker_config

				return await fn(query, documents)
			}

			const reranker = await this.loadRerankerModel()

			const output = await reranker(query, documents, {
				truncation: true,
				max_length: 2048
			})

			return output
		})
	}

	async search(args: PipelineSearchArgs) {
		const { query, rerank_limit = 20, vector_search, fulltext_search } = args

		const [vector_results, fulltext_results] = await Promise.all([vector_search(), fulltext_search()])

		const candidates_map = new Map<number, SearchCandidate>()

		for (const r of vector_results) {
			if (candidates_map.has(r.id)) continue

			candidates_map.set(r.id, {
				id: r.id,
				content: r.content,
				source: 'vector'
			})
		}

		for (const r of fulltext_results) {
			if (candidates_map.has(r.id)) continue

			candidates_map.set(r.id, {
				id: r.id,
				content: r.content,
				source: 'fulltext'
			})
		}

		const candidates = Array.from(candidates_map.values())

		const documents = candidates.map(c => c.content)

		const rerank_scores = await this.rerank(query, documents)

		const results: SearchResult[] = candidates.map((candidate, index) => ({
			id: candidate.id,
			content: candidate.content,
			source: candidate.source,
			rerankScore: rerank_scores[index]?.score ?? 0
		}))

		return results.sort((a, b) => b.rerankScore - a.rerankScore).slice(0, rerank_limit)
	}

	async checkModels() {
		env.cacheDir = this.cache_dir
		env.allowLocalModels = true

		await Promise.all([
			this.checkAndDownload(this.embedding_config, this.loadEmbeddingModel.bind(this)),
			(async () => {
				await new Promise(resolve => setTimeout(resolve, 500))
				await this.checkAndDownload(this.reranker_config, this.loadRerankerModel.bind(this))
			})()
		])
	}

	private async checkAndDownload(config: EmbeddingConfig | RerankerConfig, load_fn: () => Promise<any>) {
		if (config.type !== 'local' || !this.cache_dir) return

		const model_path = path.join(this.cache_dir, config.model)

		const [err] = await to(load_fn())

		if (err) {
			await fs.remove(model_path)
			await new Promise(resolve => setTimeout(resolve, 2000))
			await load_fn()
		}
	}

	@catchFinally(function (this: Pipeline) {
		this.embedding_promise = null
	})
	async loadEmbeddingModel() {
		if (this.embedding_pipeline) return this.embedding_pipeline
		if (this.embedding_promise) return this.embedding_promise
		if (this.embedding_config.type !== 'local') return null

		const { model, dtype } = this.embedding_config

		this.embedding_promise = pipeline('feature-extraction', model, {
			dtype: dtype as any
		})

		this.embedding_pipeline = await this.embedding_promise

		return this.embedding_pipeline
	}

	@catchFinally(function (this: Pipeline) {
		this.reranker_promise = null
	})
	async loadRerankerModel() {
		if (this.reranker_pipeline) return this.reranker_pipeline
		if (this.reranker_promise) return this.reranker_promise
		if (this.reranker_config.type !== 'local') return null

		const { model, dtype } = this.reranker_config

		this.reranker_promise = pipeline('text-classification' as any, model, {
			dtype: dtype as any
		})

		this.reranker_pipeline = await this.reranker_promise

		return this.reranker_pipeline
	}

	getEmbeddingConfig() {
		return this.embedding_config
	}

	getRerankerConfig() {
		return this.reranker_config
	}

	getCacheDir() {
		return this.cache_dir
	}

	setCacheDir(dir: string) {
		this.cache_dir = dir
		env.cacheDir = dir
	}

	getEmbeddingConcurrency() {
		return this.embedding_concurrency
	}

	setEmbeddingConcurrency(concurrency: number) {
		this.embedding_concurrency = concurrency
		this.embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
	}

	getRerankerConcurrency() {
		return this.reranker_concurrency
	}

	setRerankerConcurrency(concurrency: number) {
		this.reranker_concurrency = concurrency
		this.reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
	}

	off() {
		this.embedding_queue.clear()
		this.reranker_queue.clear()
	}
}
