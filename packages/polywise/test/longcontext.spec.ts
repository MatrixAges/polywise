import '@abraham/reflection'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { long_context_articles, multi_hop_articles } from './datasets/longcontext'
import { homonym_traps, negation_traps, similarity_traps, temporal_traps } from './datasets/traps'

const TEST_TIMEOUT = 120000

describe('Long Context and Language Traps', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_longcontext_test_${unique_id}:`

	const mockEmbedding = async (text: string) => {
		const vec = Array(1024).fill(0)
		const words = text.toLowerCase().split(/\W+/)

		words.forEach((word, i) => {
			if (i < 1024) {
				let hash = 0

				for (let j = 0; j < word.length; j++) {
					hash = (hash << 5) - hash + word.charCodeAt(j)
					hash |= 0
				}

				vec[Math.abs(hash) % 1024] += 0.1
			}
		})

		return vec
	}

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_config: { type: 'custom', fn: mockEmbedding }
		})

		for (const article of long_context_articles) {
			await poly.article.addWithEmbedding(article)
		}

		for (const article of multi_hop_articles) {
			await poly.article.addWithEmbedding(article)
		}

		for (const article of homonym_traps) {
			await poly.article.addWithEmbedding(article)
		}

		for (const article of negation_traps) {
			await poly.article.addWithEmbedding(article)
		}

		for (const article of temporal_traps) {
			await poly.article.addWithEmbedding(article)
		}

		for (const article of similarity_traps) {
			await poly.article.addWithEmbedding(article)
		}
	}, TEST_TIMEOUT)

	afterAll(async () => {
		await poly.off()
	})

	describe('Long Context Scenarios', () => {
		it('should find the "needle" in a 15,000 character article', async () => {
			const results = await poly.article.searchFts({
				query: 'stealth mode private memory',
				limit: 5
			})

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].title).toBe('Polywise Architecture Deep Dive')
			expect(results[0].content).toContain('stealth mode')
		})

		it('should handle multi-hop retrieval across long documents', async () => {
			const step1 = await poly.search({
				query: 'Where is the key for Phase 2 stored?',
				recall_depth: 2
			})

			const has_onyx_vault = step1.result.some(r => r.content.includes('Onyx Vault'))

			expect(has_onyx_vault).toBe(true)

			const step2 = await poly.search({
				query: 'What are the requirements for Onyx Vault?',
				recall_depth: 2
			})

			const has_quantum_signature = step2.result.some(r =>
				r.content.includes('quantum-resistant signature')
			)

			expect(has_quantum_signature).toBe(true)
		})
	})

	describe('Language Traps', () => {
		it('should distinguish between different meanings of "Mercury"', async () => {
			const planet_results = await poly.article.searchFts({
				query: 'Mercury planet orbit days',
				limit: 1
			})

			expect(planet_results[0].title).toBe('Mercury (Planet)')

			const element_results = await poly.article.searchFts({
				query: 'Mercury metallic element liquid',
				limit: 1
			})

			expect(element_results[0].title).toBe('Mercury (Element)')
		})

		it('should not be fooled by negation traps in full-text search', async () => {
			const results = await poly.article.searchFts({
				query: 'Polywise supports MySQL',
				limit: 5
			})

			expect(results.some(r => r.content.includes('NOT support MySQL'))).toBe(true)
		})

		it('should prioritize current version over deprecated version in temporal traps', async () => {
			const results = await poly.article.searchFts({
				query: 'Polywise specification synchronization method',
				limit: 10
			})

			const titles = results.map(r => r.title)

			expect(titles).toContain('Polywise v0.8 Specification (CURRENT)')

			const current = results.find(r => r.title.includes('CURRENT'))
			const deprecated = results.find(r => r.title.includes('DEPRECATED'))

			expect(current).toBeDefined()
			expect(deprecated).toBeDefined()
		})

		it('should distinguish between Polywise and Polly-Wise/Poly-Wise', async () => {
			const project_results = await poly.article.searchFts({
				query: 'Polywise architecture',
				limit: 5
			})

			expect(project_results.every(r => !r.title.includes('Parrot'))).toBe(true)

			const parrot_results = await poly.article.searchFts({
				query: 'Polly-Wise parrot language',
				limit: 1
			})

			expect(parrot_results[0].title).toContain('Parrot')
		})
	})
})
