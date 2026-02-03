import path from 'path'
import fs from 'fs-extra'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'

describe.concurrent('Polywise Pure Text Learning', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_learning_${unique_id}:`
	const datasets_dir = path.resolve(__dirname, './datasets/text')

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir: db_name,
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
		const chunks: string[] = []
		let start = 0

		while (start < text.length) {
			chunks.push(text.slice(start, start + size))
			start += size
		}

		return chunks
	}

	describe('Large Scale Text Ingestion and Retrieval', () => {
		it('should ingest complex literature and perform semantic search', async () => {
			const text = await loadDataset('complex_literature')
			const chunks = chunkText(text, 1500).slice(0, 20) // Take first 20 chunks for performance in tests

			for (let i = 0; i < chunks.length; i++) {
				await poly.article.addWithEmbedding(chunks[i])
			}

			const results = await poly.article.searchByVector(
				'What are the main social interactions described in the text?',
				5
			)

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].similarity).toBeGreaterThan(0.3)
		}, 120000)

		it('should handle cross-domain knowledge retrieval (Neuroscience vs Philosophy)', async () => {
			const neuro_text = await loadDataset('neuroscience')
			const phil_text = await loadDataset('philosophy')

			await poly.article.addWithEmbedding(`Neuroscience Overview: ${neuro_text.slice(0, 5000)}`)

			await poly.article.addWithEmbedding(`Philosophy Overview: ${phil_text.slice(0, 5000)}`)

			const neuro_results = await poly.article.searchByText('nervous system and brain functions', 5)

			expect(neuro_results.some(r => r.content.includes('Neuroscience'))).toBe(true)

			const phil_results = await poly.article.searchByVector('nature of reality and existence', 5)

			expect(phil_results.some(r => r.content.includes('Philosophy'))).toBe(true)
		})

		it('should process AI research papers and extract relevant concepts via RAG', async () => {
			const ai_text = await loadDataset('ai_research')
			const chunks = chunkText(ai_text, 1200).slice(0, 10)

			for (const chunk of chunks) {
				await poly.article.addWithEmbedding(chunk)
			}

			const query = 'transformer architecture and self-attention mechanism'
			const { result } = await poly.query({
				query,
				search_limit: 5,
				rerank_limit: 3
			})

			expect(result.length).toBeGreaterThan(0)
			expect(result[0].content.toLowerCase()).toContain('transformer')
		}, 60000)

		it('should maintain performance with legal and physics datasets', async () => {
			const legal_text = await loadDataset('legal')
			const physics_text = await loadDataset('physics')

			await Promise.all([
				poly.article.addWithEmbedding(`Legal Foundations: ${legal_text.slice(0, 8000)}`),
				poly.article.addWithEmbedding(`Physics Principles: ${physics_text.slice(0, 8000)}`)
			])

			const startTime = Date.now()
			const results = await poly.article.searchByVector('quantum mechanics and constitutional law', 10)
			const duration = Date.now() - startTime

			expect(results.length).toBeGreaterThan(0)
			expect(duration).toBeLessThan(5000) // Model inference can be slow
		})
	})
})
