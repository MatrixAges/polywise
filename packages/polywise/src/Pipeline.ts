import { env, pipeline } from '@huggingface/transformers'
import { singleton } from 'tsyringe'

import {
	PIPELINE_TASK_FEATURE_EXTRACTION,
	PIPELINE_TASK_RERANKING,
	DEFAULT_EMBEDDING_MODEL,
	DEFAULT_RERANKER_MODEL,
	DEFAULT_DTYPE,
	DEFAULT_API_EMBEDDING_MODEL,
	DEFAULT_API_RERANKER_MODEL,
	POOLING_MEAN,
	HTTP_HEADERS
} from './consts'

import type { EmbeddingConfig, RerankerConfig, PipelineArgs } from './types'

const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
	type: 'local',
	model: DEFAULT_EMBEDDING_MODEL,
	dtype: DEFAULT_DTYPE
}

const DEFAULT_RERANKER_CONFIG: RerankerConfig = {
	type: 'local',
	model: DEFAULT_RERANKER_MODEL,
	dtype: DEFAULT_DTYPE
}

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

		this.embedding = await pipeline(PIPELINE_TASK_FEATURE_EXTRACTION as any, model, {
			dtype: dtype as any
		})
	}

	async loadRerankerModel() {
		if (this.reranker_config.type !== 'local') {
			return
		}

		const { model, dtype } = this.reranker_config

		this.reranker = await pipeline(PIPELINE_TASK_RERANKING as any, model, {
			dtype: dtype as any
		})
	}

	async setEmbeddingConfig(config: EmbeddingConfig) {
		this.embedding_config = config

		if (config.type === 'local') {
			await this.loadEmbeddingModel()
		} else if (config.type === 'api' || config.type === 'custom') {
			this.embedding = null
		}
	}

	async setRerankerConfig(config: RerankerConfig) {
		this.reranker_config = config

		if (config.type === 'local') {
			await this.loadRerankerModel()
		} else if (config.type === 'api' || config.type === 'custom') {
			this.reranker = null
		}
	}

	async embed(text: string) {
		if (this.embedding_config.type === 'custom') {
			const { fn } = this.embedding_config

			return await fn(text)
		}

		if (this.embedding_config.type === 'api') {
			const { api_url, api_key, model } = this.embedding_config

			if (!api_url) {
				throw new Error('API URL not configured for embedding')
			}

			const response = await fetch(api_url, {
				method: 'POST',
				headers: {
					[HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.CONTENT_TYPE_JSON,
					...(api_key && { [HTTP_HEADERS.AUTHORIZATION]: `Bearer ${api_key}` })
				},
				body: JSON.stringify({
					model: model || DEFAULT_API_EMBEDDING_MODEL,
					input: text
				})
			})

			if (!response.ok) {
				throw new Error(`Embedding API error: ${response.statusText}`)
			}

			const data = await response.json()

			return data.data[0].embedding
		}

		if (!this.embedding) {
			await this.loadEmbeddingModel()
		}

		const output = await this.embedding(text, {
			pooling: POOLING_MEAN,
			normalize: true
		})

		return Array.from(output.data)
	}

	async rerank(query: string, documents: string[]) {
		if (this.reranker_config.type === 'custom') {
			const { fn } = this.reranker_config

			return await fn(query, documents)
		}

		if (this.reranker_config.type === 'api') {
			const { api_url, api_key, model } = this.reranker_config

			if (!api_url) {
				throw new Error('API URL not configured for reranking')
			}

			const response = await fetch(api_url, {
				method: 'POST',
				headers: {
					[HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.CONTENT_TYPE_JSON,
					...(api_key && { [HTTP_HEADERS.AUTHORIZATION]: `Bearer ${api_key}` })
				},
				body: JSON.stringify({
					model: model || DEFAULT_API_RERANKER_MODEL,
					query,
					documents
				})
			})

			if (!response.ok) {
				throw new Error(`Reranker API error: ${response.statusText}`)
			}

			const data = await response.json()

			return data.results
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
