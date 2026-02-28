import { join } from 'path'
import { env, pipeline, Tensor } from '@huggingface/transformers'
import to from 'await-to-js'
import { remove } from 'fs-extra'
import { injectable } from 'tsyringe'

import {
	checkModelExsit,
	generateModelHash,
	getAvgVectors,
	getKeywordsByKeyBERT,
	getTextChunks,
	splitSentence
} from '@/utils'

import { app } from '../consts'

import type { FeatureExtractionPipeline, TextClassificationPipeline } from '@huggingface/transformers'
import type { RequiredDeep } from 'type-fest'
import type { EmbeddingConfig, PipelineConfig, RequiredPipelineConfig, RerankerConfig } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise
	private config!: RequiredDeep<RequiredPipelineConfig>
	private embedding!: FeatureExtractionPipeline
	private reranker!: TextClassificationPipeline

	async init(p: Polywise, config?: PipelineConfig) {
		const { models_dir, embedding_config, reranker_config, keyword_config } = config || {}

		this.p = p
		this.config = config as RequiredDeep<RequiredPipelineConfig>
		this.config.models_dir = models_dir || app.default_models_dir
		this.config.embedding_config = embedding_config || app.default_embedding_config
		this.config.reranker_config = reranker_config || app.default_reranker_config
		this.config.keyword_config = keyword_config || app.default_keyword_config

		env.cacheDir = this.config.models_dir
		env.localModelPath = this.config.models_dir
		env.allowLocalModels = true

		this.checkModels()
	}

	async checkModels() {
		await Promise.all([
			this.checkAndDownload(this.config.embedding_config, this.loadEmbeddingModel),
			this.checkAndDownload(this.config.reranker_config, this.loadRerankerModel)
		])
	}

	async embed(text: string) {
		this.p.logger.log('PIPELINE', 'embedding start', () => ({ text_length: text.length }))

		const chunks = await getTextChunks(text)

		const results = await Promise.all(
			chunks.map((chunk, index) => {
				this.p.logger.log('PIPELINE', 'embedding chunk', () => ({
					index: index + 1,
					chunk: chunk.length
				}))

				return this.embedChunk(chunk)
			})
		)

		if (results.length === 1) return results[0]

		this.p.logger.log('PIPELINE', 'embedding end', () => ({ results: results.flat().length }))

		return getAvgVectors(results)
	}

	private async embedChunk(chunk: string) {
		if (this.config.embedding_config.type === 'custom') {
			const { fn } = this.config.embedding_config

			const res = await fn(chunk)

			return res as Array<number>
		}

		await this.loadEmbeddingModel()

		const output = await this.embedding(chunk, {
			pooling: 'mean',
			normalize: true
		})

		return Array.from((output as Tensor).data as number[]) as Array<number>
	}

	async rerank(query: string, documents: Array<string>) {
		this.p.logger.log('PIPELINE', 'rerank starting', () => ({ query, document_length: documents.length }))

		if (!documents.length) return []

		if (this.config.reranker_config.type === 'custom') {
			const { fn } = this.config.reranker_config

			const output = await fn(query, documents)

			return output
		}

		await this.loadRerankerModel()

		const batch_size = 4
		const scores: Array<{ score: number }> = []

		for (let i = 0; i < documents.length; i += batch_size) {
			const chunk = documents.slice(i, i + batch_size)
			const texts = new Array(chunk.length).fill(query)

			this.p.logger.log(
				'PIPELINE',
				`rerank: batch ${Math.floor(i / batch_size) + 1}/${Math.ceil(documents.length / batch_size)}`,
				() => ({
					chunk_size: chunk.length,
					memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'MB'
				})
			)

			const encoded = await this.reranker.tokenizer(texts, {
				text_pair: chunk,
				padding: true,
				truncation: true,
				max_length: 512
			})

			const output = await this.reranker.model(encoded)

			const logits = output.logits.data

			for (let j = 0; j < logits.length; j++) {
				const logit = logits[j]
				const score = 1 / (1 + Math.exp(-logit))

				scores.push({ score })
			}
		}

		this.p.logger.log('PIPELINE', 'rerank finished')

		return scores
	}

	async getKeywords(text: string) {
		if (!text.trim()) return []

		this.p.logger.log('PIPELINE', 'keyword generation start')

		const sentences = await splitSentence([text])
		const all_keywords: Array<string> = []

		for (const sentence of sentences) {
			const keywords = await this.getSentenceKeywords(sentence)

			if (keywords.length) all_keywords.push(...keywords)
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

	private async getSentenceKeywords(sentence: string) {
		if (this.config.keyword_config.type === 'custom') {
			return this.config.keyword_config.fn(sentence)
		}

		if (sentence.length < 5) return []

		await this.loadEmbeddingModel()

		const extracted = await getKeywordsByKeyBERT(sentence, this.embedding, 5)

		if (!extracted || extracted.length === 0) return []

		return extracted.map(k => k.word)
	}

	// async search(query: PipelineSearchArgs) {
	// 	const { query } = args

	// 	const [vector_results, fulltext_results] = await Promise.all([vectorSearch(), fulltextSearch()])

	// 	const candidates_map = new Map<string, SearchCandidate>()
	// 	const content_set = new Set<string>()

	// 	for (const r of vector_results) {
	// 		if (candidates_map.has(r.id)) continue
	// 		if (content_set.has(r.content)) continue

	// 		candidates_map.set(r.id, {
	// 			id: r.id,
	// 			content: r.content,
	// 			source: 'vector',
	// 			metadata: r.metadata,
	// 			updated_at: r.updated_at,
	// 			context_id: r.context_id
	// 		})
	// 		content_set.add(r.content)
	// 	}

	// 	for (const r of fulltext_results) {
	// 		if (candidates_map.has(r.id)) continue
	// 		if (content_set.has(r.content)) continue

	// 		candidates_map.set(r.id, {
	// 			id: r.id,
	// 			content: r.content,
	// 			source: 'fulltext',
	// 			metadata: r.metadata,
	// 			updated_at: r.updated_at,
	// 			context_id: r.context_id
	// 		})
	// 		content_set.add(r.content)
	// 	}

	// 	const candidates = Array.from(candidates_map.values())

	// 	const documents = candidates.map(c => c.content)

	// 	const rerank_scores = await this.rerank(query, documents)

	// 	const results: Array<SearchResult> = candidates.map((candidate, index) => ({
	// 		id: candidate.id,
	// 		content: candidate.content,
	// 		source: candidate.source,
	// 		rerankScore: rerank_scores[index]?.score ?? 0,
	// 		metadata: candidate.metadata,
	// 		updated_at: candidate.updated_at,
	// 		context_id: candidate.context_id
	// 	}))

	// 	return results.sort((a, b) => b.rerankScore - a.rerankScore).slice(0, rerank_limit)
	// }

	private async checkAndDownload(config: EmbeddingConfig | RerankerConfig, loadFn: () => Promise<unknown>) {
		if (config.type !== 'local') return

		const model_path = join(this.config.models_dir, config.model)
		const exist = await checkModelExsit(model_path)

		if (exist) return

		const res = await loadFn()

		if (res === 'err') {
			await remove(model_path)

			await new Promise(resolve => setTimeout(resolve, 300))

			await loadFn()
		}

		await generateModelHash(model_path)
	}

	private async loadEmbeddingModel() {
		if (this.embedding) return this.embedding
		if (this.config.embedding_config.type !== 'local') return null

		const { model } = this.config.embedding_config

		const [err, res] = await to(pipeline('feature-extraction', model, { dtype: 'q8' }))

		if (err) return 'err'

		this.embedding = res

		return res
	}

	private async loadRerankerModel() {
		if (this.reranker) return this.reranker
		if (this.config.reranker_config.type !== 'local') return null

		const { model } = this.config.reranker_config

		const [err, res] = await to(pipeline('text-classification', model, { dtype: 'q8' }))

		if (err) return 'err'

		this.reranker = res

		return res
	}
}
