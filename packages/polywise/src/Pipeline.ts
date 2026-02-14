import os from 'os'
import path from 'path'
import { env, pipeline } from '@huggingface/transformers'
import to from 'await-to-js'
import fs from 'fs-extra'
import PQueue from 'p-queue'
import { injectable } from 'tsyringe'

import {
	DEFAULT_CONCURRENCY,
	DEFAULT_DECISION_CONFIG,
	DEFAULT_EMBEDDING_CONFIG,
	DEFAULT_RERANKER_CONFIG,
	POOLING_MEAN
} from './consts'
import { catchFinally } from './decorators'
import processText from './utils/processText'

import type {
	DecisionConfig,
	DecisionOptions,
	EmbeddingConfig,
	PipelineArgs,
	PipelineSearchArgs,
	RerankerConfig,
	SearchCandidate,
	SearchResult
} from './types'

@injectable()
export default class Pipeline {
	private embedding_config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG
	private reranker_config: RerankerConfig = DEFAULT_RERANKER_CONFIG
	private decision_config: DecisionConfig = DEFAULT_DECISION_CONFIG
	private cache_dir: string | null = `${os.homedir()}/.polywise/.models`
	private embedding_concurrency: number = DEFAULT_CONCURRENCY
	private reranker_concurrency: number = DEFAULT_CONCURRENCY
	private decision_concurrency: number = DEFAULT_CONCURRENCY
	private embedding_pipeline: any = null
	private reranker_pipeline: any = null
	private decision_pipeline: any = null
	private embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
	private reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
	private decision_queue = new PQueue({ concurrency: this.decision_concurrency })
	private embedding_promise: Promise<any> | null = null
	private reranker_promise: Promise<any> | null = null
	private decision_promise: Promise<any> | null = null

	async init(args: PipelineArgs = {}) {
		const {
			cache_dir,
			embedding_config,
			reranker_config,
			decision_config,
			embedding_concurrency,
			reranker_concurrency,
			decision_concurrency
		} = args

		if (cache_dir) {
			this.cache_dir = cache_dir
		}

		env.cacheDir = this.cache_dir
		env.localModelPath = this.cache_dir
		env.allowRemoteModels = false
		env.allowLocalModels = true

		if (embedding_config) {
			this.embedding_config = embedding_config
			this.embedding_pipeline = null
		}

		if (reranker_config) {
			this.reranker_config = reranker_config
			this.reranker_pipeline = null
		}

		if (decision_config) {
			this.decision_config = decision_config
			this.decision_pipeline = null
		}

		if (embedding_concurrency !== undefined) {
			this.embedding_concurrency = embedding_concurrency

			this.embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
		}

		if (reranker_concurrency !== undefined) {
			this.reranker_concurrency = reranker_concurrency

			this.reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
		}

		if (decision_concurrency !== undefined) {
			this.decision_concurrency = decision_concurrency

			this.decision_queue = new PQueue({ concurrency: this.decision_concurrency })
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

	async setDecisionConfig(config: DecisionConfig) {
		this.decision_config = config
		this.decision_pipeline = null

		if (config.type === 'local') {
			await this.loadDecisionModel()
		}
	}

	async embed(text: string) {
		const chunks = await processText(text)

		const results = await Promise.all(
			chunks.map(chunk =>
				this.embedding_queue.add(async () => {
					if (this.embedding_config.type === 'custom') {
						const { fn } = this.embedding_config

						return (await fn(chunk)) as Array<number>
					}

					const embedding = await this.loadEmbeddingModel()

					const output = await embedding(chunk, {
						pooling: POOLING_MEAN,
						normalize: true,
						truncation: true,
						max_length: 2048
					})

					return Array.from((output as any).data) as Array<number>
				})
			)
		)

		if (results.length === 1) {
			return results[0] as Array<number>
		}

		const vectors = results as Array<Array<number>>
		const vector_length = vectors[0].length
		const summed_vector = new Array(vector_length).fill(0)

		for (const vec of vectors) {
			for (let i = 0; i < vector_length; i++) {
				summed_vector[i] += vec[i]
			}
		}

		return summed_vector.map(val => val / vectors.length)
	}

	async rerank(query: string, documents: Array<string>) {
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

	async decide(prompt: string, options: DecisionOptions = {}) {
		return this.decision_queue.add(async () => {
			if (this.decision_config.type === 'custom') {
				const { fn } = this.decision_config

				return await fn(prompt, options)
			}

			const decision = await this.loadDecisionModel()

			const { max_new_tokens = 64, temperature = 0.6, top_k = 20, top_p = 0.9 } = options

			const output = await decision(prompt, {
				max_new_tokens,
				temperature,
				top_k,
				top_p,
				do_sample: temperature > 0
			})

			return output[0].generated_text.slice(prompt.length).trim()
		})
	}

	async search(args: PipelineSearchArgs) {
		const { query, rerank_limit = 20, vectorSearch, fulltextSearch } = args

		const [vector_results, fulltext_results] = await Promise.all([vectorSearch(), fulltextSearch()])

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

		const results: Array<SearchResult> = candidates.map((candidate, index) => ({
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
			})(),
			(async () => {
				await new Promise(resolve => setTimeout(resolve, 1000))
				await this.checkAndDownload(this.decision_config, this.loadDecisionModel.bind(this))
			})()
		])
	}

	private async checkAndDownload(
		config: EmbeddingConfig | RerankerConfig | DecisionConfig,
		loadFn: () => Promise<any>
	) {
		if (config.type !== 'local' || !this.cache_dir) return

		const model_path = path.join(this.cache_dir, config.model)

		const [err] = await to(loadFn())

		if (err) {
			await fs.remove(model_path)

			await new Promise(resolve => setTimeout(resolve, 2000))

			await loadFn()
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

	@catchFinally(function (this: Pipeline) {
		this.decision_promise = null
	})
	async loadDecisionModel() {
		if (this.decision_pipeline) return this.decision_pipeline
		if (this.decision_promise) return this.decision_promise
		if (this.decision_config.type !== 'local') return null

		const { model, dtype } = this.decision_config

		this.decision_promise = pipeline('text-generation', model, {
			dtype: dtype as any
		})

		this.decision_pipeline = await this.decision_promise

		return this.decision_pipeline
	}

	getEmbeddingConfig() {
		return this.embedding_config
	}

	getRerankerConfig() {
		return this.reranker_config
	}

	getDecisionConfig() {
		return this.decision_config
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

	getDecisionConcurrency() {
		return this.decision_concurrency
	}

	setDecisionConcurrency(concurrency: number) {
		this.decision_concurrency = concurrency
		this.decision_queue = new PQueue({ concurrency: this.decision_concurrency })
	}

	off() {
		this.embedding_queue.clear()
		this.reranker_queue.clear()
		this.decision_queue.clear()
	}
}
