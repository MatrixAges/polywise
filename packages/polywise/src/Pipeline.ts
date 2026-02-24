import os from 'os'
import path from 'path'
import { env, pipeline, Tensor } from '@huggingface/transformers'
import to from 'await-to-js'
import fs from 'fs-extra'
import { injectable } from 'tsyringe'

import Console from './Console'
import { DEFAULT_EMBEDDING_CONFIG, DEFAULT_KEYWORD_CONFIG, DEFAULT_RERANKER_CONFIG, POOLING_MEAN } from './consts'
import { generateModelHash, processText, splitSentence, verifyModel } from './utils'
import KeyBERT from './utils/KeyBERT'

import type { FeatureExtractionPipeline, TextClassificationPipeline } from '@huggingface/transformers'
import type {
	EmbeddingConfig,
	KeywordConfig,
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
	private keyword_config: KeywordConfig = DEFAULT_KEYWORD_CONFIG
	private cache_dir: string = `${os.homedir()}/.polywise/.models`
	private embedding?: Promise<FeatureExtractionPipeline | null>
	private reranker?: Promise<TextClassificationPipeline | null>

	async init(args: PipelineArgs = {}) {
		const { cache_dir, embedding_config, reranker_config, keyword_config } = args

		if (cache_dir) {
			this.cache_dir = cache_dir
		}

		env.cacheDir = this.cache_dir
		env.localModelPath = this.cache_dir
		env.allowLocalModels = true

		if (embedding_config) {
			this.embedding_config = embedding_config
			delete this.embedding
		}

		if (reranker_config) {
			this.reranker_config = reranker_config
			delete this.reranker
		}

		if (keyword_config) {
			this.keyword_config = keyword_config
		}
	}

	async setEmbeddingConfig(config: EmbeddingConfig) {
		this.embedding_config = config
		delete this.embedding

		if (config.type === 'local') {
			await this.loadEmbeddingModel()
		}
	}

	async setRerankerConfig(config: RerankerConfig) {
		this.reranker_config = config
		delete this.reranker

		if (config.type === 'local') {
			await this.loadRerankerModel()
		}
	}

	async setKeywordConfig(config: KeywordConfig) {
		this.keyword_config = config
	}

	async generateKeywords(text: string) {
		if (!text.trim()) return []

		Console.log('PIPELINE', 'keyword generation start')

		const sentences = await splitSentence([text])
		const all_keywords: Array<string> = []

		for (const sentence of sentences) {
			if (sentence.length < 5) continue

			const keywords = await (async () => {
				if (this.keyword_config.type === 'custom') {
					const keywords = await this.keyword_config.fn(sentence)
					return keywords.map(String)
				}

				const extractor = await this.loadEmbeddingModel()
				if (!extractor) return []

				const extracted = await KeyBERT.extract(sentence, extractor, 5)

				if (!extracted || extracted.length === 0) {
					return []
				}

				return extracted.map(k => k.word)
			})()

			if (keywords && keywords.length > 0) {
				all_keywords.push(...keywords)
			}
		}

		const unique_keywords: Array<string> = []
		const seen = new Set<string>()

		for (const kw of all_keywords) {
			const key = kw.toLowerCase().trim()
			if (!key) continue
			if (!seen.has(key)) {
				unique_keywords.push(kw.trim())
				seen.add(key)
			}
		}

		return unique_keywords
	}

	async embed(text: string) {
		Console.log('PIPELINE', 'embedding start', { text_len: text.length })

		const chunks = await processText(text)

		const results = await Promise.all(
			chunks.map(async chunk => {
				if (this.embedding_config.type === 'custom') {
					const { fn } = this.embedding_config

					return (await fn(chunk)) as Array<number>
				}

				const embedding_pipeline = await this.loadEmbeddingModel()
				if (!embedding_pipeline) throw new Error('Failed to load embedding model')

				const output = await (
					embedding_pipeline as unknown as (
						text: string,
						options: Record<string, unknown>
					) => Promise<Tensor>
				)(chunk, {
					pooling: POOLING_MEAN,
					normalize: true,
					truncation: true,
					max_length: 2048
				})

				return Array.from((output as Tensor).data as number[]) as Array<number>
			})
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

		Console.log('PIPELINE', 'rerank starting', { query, doc_count: documents.length })

		const all_scores = await (async () => {
			if (this.reranker_config.type === 'custom') {
				const { fn } = this.reranker_config
				const output = await fn(query, documents)

				return this.normalizeRerankOutput(output)
			}

			const reranker_pipeline = await this.loadRerankerModel()
			if (!reranker_pipeline) throw new Error('Failed to load reranker model')

			const batch_size = 4
			const scores: Array<{ score: number }> = []

			for (let i = 0; i < documents.length; i += batch_size) {
				const chunk = documents.slice(i, i + batch_size)
				const texts = new Array(chunk.length).fill(query)

				Console.log(
					'PIPELINE',
					`rerank: batch ${Math.floor(i / batch_size) + 1}/${Math.ceil(documents.length / batch_size)}`,
					{
						chunk_size: chunk.length,
						memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'MB'
					}
				)

				const encoded = await reranker_pipeline.tokenizer(texts, {
					text_pair: chunk,
					padding: true,
					truncation: true,
					max_length: 512
				})

				const output = await (
					reranker_pipeline as unknown as {
						model: (encoded: unknown) => Promise<{ logits: Tensor }>
					}
				).model(encoded)
				const logits = output.logits.data

				for (let j = 0; j < logits.length; j++) {
					const logit = logits[j]
					const score = 1 / (1 + Math.exp(-logit))
					scores.push({ score })
				}
			}

			return scores
		})()

		Console.log('PIPELINE', 'rerank finished')
		return all_scores || []
	}

	private normalizeRerankOutput(output: unknown) {
		if (!Array.isArray(output)) return []

		return output.map(item => ({ score: this.extractRerankScore(item) }))
	}

	private extractRerankScore(item: unknown) {
		if (typeof item === 'number') {
			return item
		}

		if (this.isScoreObject(item)) {
			return item.score
		}

		if (Array.isArray(item)) {
			const valid_items = item.filter(this.isLabelScoreObject)

			if (valid_items.length === 0) return 0

			if (valid_items.length === 1) {
				return valid_items[0].score
			}

			const positive_label = valid_items.find(entry => {
				const label = entry.label.toLowerCase()

				return label.includes('label_1') || label.includes('relevant') || label.includes('positive')
			})

			if (positive_label) {
				return positive_label.score
			}

			return Math.max(...valid_items.map(entry => entry.score))
		}

		return 0
	}

	private isScoreObject(value: unknown): value is { score: number } {
		if (!value || typeof value !== 'object') return false

		const score = (value as { score?: unknown }).score

		return typeof score === 'number'
	}

	private isLabelScoreObject(value: unknown): value is { label: string; score: number } {
		if (!value || typeof value !== 'object') return false

		const score = (value as { score?: unknown }).score
		const label = (value as { label?: unknown }).label

		return typeof score === 'number' && typeof label === 'string'
	}

	async search(args: PipelineSearchArgs) {
		const { query, rerank_limit = 20, vectorSearch, fulltextSearch } = args

		const [vector_results, fulltext_results] = await Promise.all([vectorSearch(), fulltextSearch()])

		const candidates_map = new Map<string, SearchCandidate>()
		const content_set = new Set<string>()

		for (const r of vector_results) {
			if (candidates_map.has(r.id)) continue
			if (content_set.has(r.content)) continue

			candidates_map.set(r.id, {
				id: r.id,
				content: r.content,
				source: 'vector',
				metadata: r.metadata,
				updated_at: r.updated_at
			})
			content_set.add(r.content)
		}

		for (const r of fulltext_results) {
			if (candidates_map.has(r.id)) continue
			if (content_set.has(r.content)) continue

			candidates_map.set(r.id, {
				id: r.id,
				content: r.content,
				source: 'fulltext',
				metadata: r.metadata,
				updated_at: r.updated_at
			})
			content_set.add(r.content)
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
			this.checkAndDownload(this.reranker_config, this.loadRerankerModel.bind(this))
		])
	}

	private async checkAndDownload(config: EmbeddingConfig | RerankerConfig, loadFn: () => Promise<unknown>) {
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

	async loadEmbeddingModel() {
		if (this.embedding) return this.embedding

		if (this.embedding_config.type !== 'local') return null

		const { model, dtype } = this.embedding_config

		this.embedding = pipeline('feature-extraction', model, {
			dtype
		}) as unknown as Promise<FeatureExtractionPipeline>

		return this.embedding
	}

	async loadRerankerModel() {
		if (this.reranker) return this.reranker

		if (this.reranker_config.type !== 'local') return null

		const { model, dtype } = this.reranker_config

		this.reranker = pipeline('text-classification', model, {
			dtype
		}) as unknown as Promise<TextClassificationPipeline>

		return this.reranker
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

	getKeywordConfig() {
		return this.keyword_config
	}

	off() {
		delete this.embedding
		delete this.reranker
	}
}
