import { env, pipeline, PipelineType } from '@huggingface/transformers'
import { singleton } from 'tsyringe'

import type { EmbeddingConfig, RerankerConfig, PipelineArgs } from './types'

@singleton()
export default class Pipeline {
	private embedding_pipeline: any = null
	private reranker_pipeline: any = null
	private embedding_config: EmbeddingConfig = {
		type: 'local',
		model: 'onnx-community/Qwen3-Embedding-0.6B-ONNX',
		dtype: 'q8'
	}
	private reranker_config: RerankerConfig = {
		type: 'local',
		model: 'onnx-community/Qwen3-Reranker-0.6B-ONNX',
		dtype: 'q8'
	}
	private cache_dir: string | null = null

	constructor() {}

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
		if (this.embedding_config.type === 'api') {
			return
		}

		const { model, dtype } = this.embedding_config

		this.embedding_pipeline = await pipeline('feature-extraction', model, {
			dtype: dtype as any
		})
	}

	async loadRerankerModel() {
		if (this.reranker_config.type === 'api') {
			return
		}

		const { model, dtype } = this.reranker_config

		this.reranker_pipeline = await pipeline('text-reranking', model, {
			dtype: dtype as any
		})
	}

	async setEmbeddingConfig(config: EmbeddingConfig) {
		this.embedding_config = config

		if (config.type === 'local') {
			await this.loadEmbeddingModel()
		} else {
			this.embedding_pipeline = null
		}
	}

	async setRerankerConfig(config: RerankerConfig) {
		this.reranker_config = config

		if (config.type === 'local') {
			await this.loadRerankerModel()
		} else {
			this.reranker_pipeline = null
		}
	}

	async embed(text: string) {
		if (this.embedding_config.type === 'api') {
			const { api_url, api_key, model } = this.embedding_config

			if (!api_url) {
				throw new Error('API URL not configured for embedding')
			}

			const response = await fetch(api_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(api_key && { Authorization: `Bearer ${api_key}` })
				},
				body: JSON.stringify({
					model: model || 'text-embedding-3-small',
					input: text
				})
			})

			if (!response.ok) {
				throw new Error(`Embedding API error: ${response.statusText}`)
			}

			const data = await response.json()

			return data.data[0].embedding
		}

		if (!this.embedding_pipeline) {
			await this.loadEmbeddingModel()
		}

		const output = await this.embedding_pipeline(text, {
			pooling: 'mean',
			normalize: true
		})

		return Array.from(output.data)
	}

	async rerank(query: string, documents: string[]) {
		if (this.reranker_config.type === 'api') {
			const { api_url, api_key, model } = this.reranker_config

			if (!api_url) {
				throw new Error('API URL not configured for reranking')
			}

			const response = await fetch(api_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(api_key && { Authorization: `Bearer ${api_key}` })
				},
				body: JSON.stringify({
					model: model || 'rerank-english-v2.0',
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

		if (!this.reranker_pipeline) {
			await this.loadRerankerModel()
		}

		const output = await this.reranker_pipeline(query, documents)

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
		this.embedding_pipeline = null
		this.reranker_pipeline = null
	}
}
