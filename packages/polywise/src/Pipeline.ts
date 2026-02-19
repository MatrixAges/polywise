import os from 'os'
import path from 'path'
import { env, pipeline } from '@huggingface/transformers'
import to from 'await-to-js'
import fs from 'fs-extra'
import PQueue from 'p-queue'
import { injectable } from 'tsyringe'

import {
	DEFAULT_CONCURRENCY,
	DEFAULT_EMBEDDING_CONFIG,
	DEFAULT_REBEL_CONFIG,
	DEFAULT_RERANKER_CONFIG,
	formatTriple,
	POOLING_MEAN
} from './consts'
import { catchFinally } from './decorators'
import { generateModelHash, getTriple, processText, verifyModel } from './utils'

import type {
	EmbeddingConfig,
	PipelineArgs,
	PipelineSearchArgs,
	RebelConfig,
	RerankerConfig,
	SearchCandidate,
	SearchResult,
	Triple
} from './types'

@injectable()
export default class Pipeline {
	private embedding_config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG
	private reranker_config: RerankerConfig = DEFAULT_RERANKER_CONFIG
	private rebel_config: RebelConfig = DEFAULT_REBEL_CONFIG
	private cache_dir: string = `${os.homedir()}/.polywise/.models`
	private embedding_concurrency: number = DEFAULT_CONCURRENCY
	private reranker_concurrency: number = DEFAULT_CONCURRENCY
	private rebel_concurrency: number = DEFAULT_CONCURRENCY
	private embedding_pipeline: any = null
	private reranker_pipeline: any = null
	private rebel_pipeline: any = null
	private embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
	private reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
	private rebel_queue = new PQueue({ concurrency: this.rebel_concurrency })
	private embedding_promise: Promise<any> | null = null
	private reranker_promise: Promise<any> | null = null
	private rebel_promise: Promise<any> | null = null

	async init(args: PipelineArgs = {}) {
		const {
			cache_dir,
			embedding_config,
			reranker_config,
			rebel_config,
			embedding_concurrency,
			reranker_concurrency,
			rebel_concurrency
		} = args

		if (cache_dir) {
			this.cache_dir = cache_dir
		}

		env.cacheDir = this.cache_dir
		env.localModelPath = this.cache_dir
		env.allowLocalModels = true

		if (embedding_config) {
			this.embedding_config = embedding_config
			this.embedding_pipeline = null
		}

		if (reranker_config) {
			this.reranker_config = reranker_config
			this.reranker_pipeline = null
		}

		if (rebel_config) {
			this.rebel_config = rebel_config
			this.rebel_pipeline = null
		}

		if (embedding_concurrency !== undefined) {
			this.embedding_concurrency = embedding_concurrency
			this.embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
		}

		if (reranker_concurrency !== undefined) {
			this.reranker_concurrency = reranker_concurrency
			this.reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
		}

		if (rebel_concurrency !== undefined) {
			this.rebel_concurrency = rebel_concurrency
			this.rebel_queue = new PQueue({ concurrency: this.rebel_concurrency })
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

	async setRebelConfig(config: RebelConfig) {
		this.rebel_config = config
		this.rebel_pipeline = null

		if (config.type === 'local') {
			await this.loadRebelModel()
		}
	}

	async extractTriples(text: string): Promise<Array<Triple>> {
		const result = await this.rebel_queue.add<Array<Triple>>(async () => {
			if (this.rebel_config.type === 'custom') {
				const triples = await this.rebel_config.fn(text)

				return triples.map(t => ({
					subject: String(t.subject).trim(),
					predicate: String(t.predicate).trim(),
					object: String(t.object).trim(),
					learning_rate: t.learning_rate ?? 1.0,
					decay_resistance: t.decay_resistance ?? 1.0,
					metadata: t.metadata || {}
				}))
			}

			const generator = await this.loadRebelModel()
			const prompt = formatTriple(text)

			const output = await generator(prompt, {
				max_new_tokens: 30,
				do_sample: false,
				return_full_text: false,
				stop_sequences: ['<|im_end|>', '<think>', '</think>', '\n', '\n\n']
			})

			const generated_text = output[0]?.generated_text ? `{"subject":${output[0].generated_text}` : ''
			const triple = getTriple(generated_text)

			if (!triple) {
				return []
			}

			return [
				{
					subject: String(triple.subject).trim(),
					predicate: String(triple.predicate).trim(),
					object: String(triple.object).trim(),
					learning_rate: 1.0,
					decay_resistance: 1.0,
					metadata: {}
				}
			]
		})

		return result ?? []
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
		if (documents.length === 0) return []

		return this.reranker_queue.add(async () => {
			if (this.reranker_config.type === 'custom') {
				const { fn } = this.reranker_config

				return await fn(query, documents)
			}

			const reranker = await this.loadRerankerModel()

			const inputs = documents.map(doc => ({ text: query, text_pair: doc }))

			const output = await reranker(inputs, {
				truncation: true,
				max_length: 2048,
				padding: true
			})

			return output
		})
	}

	async search(args: PipelineSearchArgs) {
		const { query, rerank_limit = 20, vectorSearch, fulltextSearch } = args

		const [vector_results, fulltext_results] = await Promise.all([vectorSearch(), fulltextSearch()])

		const candidates_map = new Map<string, SearchCandidate>()

		for (const r of vector_results) {
			if (candidates_map.has(r.id)) continue

			candidates_map.set(r.id, {
				id: r.id,
				content: r.content,
				source: 'vector',
				metadata: r.metadata,
				updated_at: r.updated_at
			})
		}

		for (const r of fulltext_results) {
			if (candidates_map.has(r.id)) continue

			candidates_map.set(r.id, {
				id: r.id,
				content: r.content,
				source: 'fulltext',
				metadata: r.metadata,
				updated_at: r.updated_at
			})
		}

		const candidates = Array.from(candidates_map.values())

		const documents = candidates.map(c => c.content)

		const rerank_scores = await this.rerank(query, documents)

		const results: Array<SearchResult> = candidates.map((candidate, index) => ({
			id: candidate.id,
			content: candidate.content,
			source: candidate.source,
			rerankScore: rerank_scores[index]?.score ?? 0,
			metadata: candidate.metadata,
			updated_at: candidate.updated_at
		}))

		return results.sort((a, b) => b.rerankScore - a.rerankScore).slice(0, rerank_limit)
	}

	async checkModels() {
		env.cacheDir = this.cache_dir
		env.allowLocalModels = true

		await Promise.all([
			this.checkAndDownload(this.embedding_config, this.loadEmbeddingModel.bind(this)),
			this.checkAndDownload(this.reranker_config, this.loadRerankerModel.bind(this)),
			this.checkAndDownload(this.rebel_config, this.loadRebelModel.bind(this))
		])
	}

	private async checkAndDownload(
		config: EmbeddingConfig | RerankerConfig | RebelConfig,
		loadFn: () => Promise<any>
	) {
		if (config.type !== 'local' || !this.cache_dir) return

		const model_path = path.join(this.cache_dir, config.model)

		const is_valid = await verifyModel(model_path)

		if (is_valid) return

		const [err] = await to(loadFn())

		if (err) {
			await fs.remove(model_path)

			await new Promise(resolve => setTimeout(resolve, 2000))

			await loadFn()
		}

		await generateModelHash(model_path)
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
		this.rebel_promise = null
	})
	async loadRebelModel() {
		if (this.rebel_pipeline) return this.rebel_pipeline
		if (this.rebel_promise) return this.rebel_promise
		if (this.rebel_config.type !== 'local') return null

		const { model, dtype } = this.rebel_config

		this.rebel_promise = pipeline('text-generation', model, {
			dtype: dtype as any
		})

		this.rebel_pipeline = await this.rebel_promise

		return this.rebel_pipeline
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

	getRebelConfig() {
		return this.rebel_config
	}

	getRebelConcurrency() {
		return this.rebel_concurrency
	}

	setRebelConcurrency(concurrency: number) {
		this.rebel_concurrency = concurrency
		this.rebel_queue = new PQueue({ concurrency: this.rebel_concurrency })
	}

	off() {
		this.embedding_queue.clear()
		this.reranker_queue.clear()
		this.rebel_queue.clear()
	}
}
