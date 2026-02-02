import { env, pipeline } from '@huggingface/transformers'
import { singleton } from 'tsyringe'

import { DEFAULT_EMBEDDING_CONFIG, DEFAULT_RERANKER_CONFIG, POOLING_MEAN } from './consts'

import type { EmbeddingConfig, RerankerConfig, PipelineArgs } from './types'

@singleton()
export default class Pipeline {
	private embedding: any = null
	private reranker: any = null
	private embedding_config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG
	private reranker_config: RerankerConfig = DEFAULT_RERANKER_CONFIG
	private cache_dir: string | null = null

	async init(args: PipelineArgs = {}) {
		const { cache_dir, embedding_config, reranker_config } = args

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

		await this.loadEmbeddingModel()
	}

	async loadEmbeddingModel() {
		if (this.embedding_config.type !== 'local') {
			return
		}

		const { model, dtype } = this.embedding_config

		this.embedding = await pipeline('feature-extraction', model, {
			dtype: dtype as any
		})
	}

	async loadRerankerModel() {
		if (this.reranker_config.type !== 'local') {
			return
		}

		const { model, dtype } = this.reranker_config

		this.reranker = await pipeline('text-classification' as any, model, {
			dtype: dtype as any
		})
	}

	async setEmbeddingConfig(config: EmbeddingConfig) {
		this.embedding_config = config

		if (config.type === 'local') {
			await this.loadEmbeddingModel()
		} else {
			this.embedding = null
		}
	}

	async setRerankerConfig(config: RerankerConfig) {
		this.reranker_config = config

		if (config.type === 'local') {
			await this.loadRerankerModel()
		} else {
			this.reranker = null
		}
	}

	async embed(text: string) {
		if (this.embedding_config.type === 'custom') {
			const { fn } = this.embedding_config

			return await fn(text)
		}

		if (!this.embedding) {
			await this.loadEmbeddingModel()
		}

		const output = await this.embedding(text, {
			pooling: POOLING_MEAN,
			normalize: true
		})

		return Array.from((output as any).data)
	}

	async rerank(query: string, documents: string[]) {
		if (this.reranker_config.type === 'custom') {
			const { fn } = this.reranker_config

			return await fn(query, documents)
		}

		if (!this.reranker) {
			await this.loadRerankerModel()
		}

		const output = await this.reranker(query, documents)

		return output
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

	off() {
		this.embedding = null
		this.reranker = null
	}
}
