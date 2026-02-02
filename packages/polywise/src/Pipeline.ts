import { env, pipeline } from '@huggingface/transformers'
import PQueue from 'p-queue'
import { singleton } from 'tsyringe'

import { DEFAULT_EMBEDDING_CONFIG, DEFAULT_RERANKER_CONFIG, POOLING_MEAN } from './consts'

import type {
	EmbeddingConfig,
	RerankerConfig,
	PipelineArgs,
	ArticleSearchResult,
	SearchResult,
	SearchCandidate
} from './types'

const DEFAULT_CONCURRENCY = 6

@singleton()
export default class Pipeline {
	private embedding_config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG
	private reranker_config: RerankerConfig = DEFAULT_RERANKER_CONFIG
	private cache_dir: string | null = null
	private embedding_concurrency: number = DEFAULT_CONCURRENCY
	private reranker_concurrency: number = DEFAULT_CONCURRENCY

	private embedding_queue: PQueue
	private reranker_queue: PQueue

	constructor() {
		this.embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
		this.reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
	}

	async init(args: PipelineArgs = {}) {
		const { cache_dir, embedding_config, reranker_config, embedding_concurrency, reranker_concurrency } = args

		if (cache_dir) {
			this.cache_dir = cache_dir
			env.cacheDir = cache_dir
		}

		if (embedding_config) {
			this.embedding_config = embedding_config
		}

		if (reranker_config) {
			this.reranker_config = reranker_config
		}

		if (embedding_concurrency !== undefined) {
			this.embedding_concurrency = embedding_concurrency
			this.embedding_queue = new PQueue({ concurrency: this.embedding_concurrency })
		}

		if (reranker_concurrency !== undefined) {
			this.reranker_concurrency = reranker_concurrency
			this.reranker_queue = new PQueue({ concurrency: this.reranker_concurrency })
		}

		await this.loadEmbeddingModel()
	}

	async loadEmbeddingModel() {
		if (this.embedding_config.type !== 'local') {
			return null
		}

		const { model, dtype } = this.embedding_config

		return await pipeline('feature-extraction', model, {
			dtype: dtype as any
		})
	}

	async loadRerankerModel() {
		if (this.reranker_config.type !== 'local') {
			return null
		}

		const { model, dtype } = this.reranker_config

		return await pipeline('text-classification' as any, model, {
			dtype: dtype as any
		})
	}

	async setEmbeddingConfig(config: EmbeddingConfig) {
		this.embedding_config = config

		if (config.type === 'local') {
			await this.loadEmbeddingModel()
		}
	}

	async setRerankerConfig(config: RerankerConfig) {
		this.reranker_config = config

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
				normalize: true
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

			const output = await reranker(query, documents)

			return output
		})
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

	async search(args: {
		query: string
		vectorSearch: () => Promise<ArticleSearchResult[]>
		fulltextSearch: () => Promise<ArticleSearchResult[]>
		rerankLimit?: number
	}) {
		const { query, vectorSearch, fulltextSearch, rerankLimit = 20 } = args

		const [vectorResults, fulltextResults] = await Promise.all([vectorSearch(), fulltextSearch()])

		const candidatesMap = new Map<number, SearchCandidate>()

		for (const r of vectorResults) {
			if (!candidatesMap.has(r.id)) {
				candidatesMap.set(r.id, {
					id: r.id,
					title: r.title,
					content: r.content,
					source: 'vector'
				})
			}
		}

		for (const r of fulltextResults) {
			if (!candidatesMap.has(r.id)) {
				candidatesMap.set(r.id, {
					id: r.id,
					title: r.title,
					content: r.content,
					source: 'fulltext'
				})
			}
		}

		const candidates = Array.from(candidatesMap.values())

		const documents = candidates.map(c => c.content)

		const rerankScores = await this.rerank(query, documents)

		const results: SearchResult[] = candidates.map((candidate, index) => ({
			id: candidate.id,
			title: candidate.title,
			content: candidate.content,
			source: candidate.source,
			rerankScore: rerankScores[index]?.score ?? 0
		}))

		return results.sort((a, b) => b.rerankScore - a.rerankScore).slice(0, rerankLimit)
	}
}
