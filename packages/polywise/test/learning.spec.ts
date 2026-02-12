import path from 'path'
import fs from 'fs-extra'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { getTestVectors } from '../scripts/getTestVectors'
import Polywise from '../src/Polywise'
import getDataDir from './utils/getDataDir'

describe.concurrent('Polywise Pure Text Learning', () => {
	const datasets_dir = path.resolve(__dirname, './datasets/text')
	const db_name = getDataDir()
	let poly: Polywise

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			},
			embedding_concurrency: 20,
			reranker_concurrency: 20
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	const loadDataset = async (name: string) => {
		const filePath = path.join(datasets_dir, `${name}.txt`)
		return await fs.readFile(filePath, 'utf-8')
	}

	const chunkText = (text: string, size = 1000) => {
		const chunks: Array<string> = []
		let start = 0

		while (start < text.length) {
			chunks.push(text.slice(start, start + size))
			start += size
		}

		return chunks
	}

	describe.concurrent('Large Scale Text Ingestion and Retrieval', () => {
		it('should ingest complex literature and perform semantic search', async () => {
			const idol_id = `lit_${Math.random().toString(36).slice(2)}`
			const text = await loadDataset('complex_literature')
			const chunks = chunkText(text, 1500).slice(0, 10)

			for (let i = 0; i < chunks.length; i++) {
				await poly.article.addWithEmbedding(chunks[i], idol_id)
			}

			const results = await poly.article.searchByVector({
				query: 'What are the main social interactions described in the text?',
				limit: 5,
				idol_id
			})

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].similarity).toBeGreaterThan(0.3)
		})

		it('should handle cross-domain knowledge retrieval (Neuroscience vs Philosophy)', async () => {
			const idol_id = `cross_${Math.random().toString(36).slice(2)}`
			const neuro_text = await loadDataset('neuroscience')
			const phil_text = await loadDataset('philosophy')

			await poly.article.addWithEmbedding(`Neuroscience Overview: ${neuro_text.slice(0, 5000)}`, idol_id)
			await poly.article.addWithEmbedding(`Philosophy Overview: ${phil_text.slice(0, 5000)}`, idol_id)

			const neuro_results = await poly.article.searchByText({
				query: 'nervous system and brain functions',
				limit: 5,
				idol_id
			})

			expect(neuro_results.some(r => r.content.includes('Neuroscience'))).toBe(true)

			const phil_results = await poly.article.searchByVector({
				query: 'nature of reality and existence',
				limit: 5,
				idol_id
			})

			expect(phil_results.some(r => r.content.includes('Philosophy'))).toBe(true)
		})

		it('should process AI research papers and extract relevant concepts via RAG', async () => {
			const idol_id = `ai_${Math.random().toString(36).slice(2)}`
			const ai_text = await loadDataset('ai_research')
			const chunks = chunkText(ai_text, 1200).slice(0, 10)

			for (const chunk of chunks) {
				await poly.article.addWithEmbedding(chunk, idol_id)
			}

			const query = 'transformer architecture and self-attention mechanism'
			const { knowledges } = await poly.query({
				query,
				search_limit: 5,
				rerank_limit: 3,
				idol_id
			})

			expect(knowledges.length).toBeGreaterThan(0)
			expect(knowledges[0].toLowerCase()).toContain('transformer')
		})

		it('should maintain performance with legal and physics datasets', async () => {
			const idol_id = `perf_${Math.random().toString(36).slice(2)}`
			const legal_text = await loadDataset('legal')
			const physics_text = await loadDataset('physics')

			await Promise.all([
				poly.article.addWithEmbedding(`Legal Foundations: ${legal_text.slice(0, 8000)}`, idol_id),
				poly.article.addWithEmbedding(`Physics Principles: ${physics_text.slice(0, 8000)}`, idol_id)
			])

			const startTime = Date.now()
			const results = await poly.article.searchByVector({
				query: 'quantum mechanics and constitutional law',
				limit: 10,
				idol_id
			})
			const duration = Date.now() - startTime

			expect(results.length).toBeGreaterThan(0)
			expect(duration).toBeLessThan(30000)
		})
	})
})
