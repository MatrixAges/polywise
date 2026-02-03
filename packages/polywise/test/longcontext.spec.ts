import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { long_context_datasets, multi_hop_datasets } from './datasets/longcontext'
import {
	homonym_traps_datasets,
	negation_traps_datasets,
	similarity_traps_datasets,
	temporal_traps_datasets
} from './datasets/traps'

const TEST_TIMEOUT = 600000

describe.concurrent('Long Context and Language Traps', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_longcontext_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_concurrency: 10,
			reranker_concurrency: 10
		})

		for (const content of long_context_datasets) {
			await poly.article.addWithEmbedding(content)
		}

		for (const content of multi_hop_datasets) {
			await poly.article.addWithEmbedding(content)
		}

		for (const content of homonym_traps_datasets) {
			await poly.article.addWithEmbedding(content)
		}

		for (const content of negation_traps_datasets) {
			await poly.article.addWithEmbedding(content)
		}

		for (const content of temporal_traps_datasets) {
			await poly.article.addWithEmbedding(content)
		}

		for (const content of similarity_traps_datasets) {
			await poly.article.addWithEmbedding(content)
		}
	}, TEST_TIMEOUT)

	afterAll(async () => {
		await poly.off()
	})

	describe.concurrent('Long Context Scenarios', () => {
		it('should find the "needle" in a 15,000 character article', async () => {
			const results = await poly.article.searchFts('stealth mode private memory', 5)

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].content).toContain('Polywise Architecture Deep Dive')
			expect(results[0].content).toContain('stealth mode')
		})

		it('should handle multi-hop retrieval across long documents', async () => {
			const step1 = await poly.query({
				query: 'Where is the key for Phase 2 stored?',
				recall_depth: 2
			})

			const has_onyx_vault = step1.result.some(r => r.content.includes('Onyx Vault'))

			expect(has_onyx_vault).toBe(true)

			const step2 = await poly.query({
				query: 'What are the requirements for Onyx Vault?',
				recall_depth: 2
			})

			const has_quantum_signature = step2.result.some(r =>
				r.content.includes('quantum-resistant signature')
			)

			expect(has_quantum_signature).toBe(true)
		})
	})

	describe.concurrent('Language Traps', () => {
		it('should distinguish between different meanings of "Mercury"', async () => {
			const planet_results = await poly.article.searchFts('Mercury planet orbit days', 1)

			expect(planet_results[0].content).toContain('Mercury (Planet)')

			const element_results = await poly.article.searchFts('Mercury metallic element liquid', 1)

			expect(element_results[0].content).toContain('Mercury (Element)')
		})

		it('should not be fooled by negation traps in full-text search', async () => {
			const results = await poly.article.searchFts('Polywise supports MySQL', 5)

			expect(results.some(r => r.content.includes('NOT support MySQL'))).toBe(true)
		})

		it('should prioritize current version over deprecated version in temporal traps', async () => {
			const results = await poly.article.searchFts('Polywise specification synchronization method', 10)

			const contents = results.map(r => r.content)

			expect(contents.some(c => c.includes('CURRENT'))).toBe(true)
			expect(contents.some(c => c.includes('DEPRECATED'))).toBe(true)
		})

		it('should distinguish between Polywise and Polly-Wise/Poly-Wise', async () => {
			const project_results = await poly.article.searchFts('Polywise architecture', 5)

			expect(project_results.every(r => !r.content.includes('Parrot'))).toBe(true)

			const parrot_results = await poly.article.searchFts('Polly-Wise parrot language', 1)

			expect(parrot_results[0].content).toContain('Parrot')
		})
	})
})
