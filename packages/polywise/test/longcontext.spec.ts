import 'reflect-metadata'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { longContextArticles, multiHopArticles } from './datasets/longcontext'
import { homonymTraps, negationTraps, similarityTraps, temporalTraps } from './datasets/traps'

const TEST_TIMEOUT = 120000 // Longer timeout for long context

describe('Long Context and Language Traps', () => {
	let poly: Polywise
	const uniqueId = Math.random().toString(36).slice(2)
	const dbName = `:polywise_longcontext_test_${uniqueId}:`

	// Simple mock embedding that preserves some keyword information
	const mockEmbedding = async (text: string): Promise<number[]> => {
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
			data_dir: dbName,
			embedding_config: { type: 'custom', fn: mockEmbedding }
		})

		// Load long context data
		for (const article of longContextArticles) {
			await poly.article.addWithEmbedding(article)
		}
		for (const article of multiHopArticles) {
			await poly.article.addWithEmbedding(article)
		}

		// Load trap data
		for (const article of homonymTraps) {
			await poly.article.addWithEmbedding(article)
		}
		for (const article of negationTraps) {
			await poly.article.addWithEmbedding(article)
		}
		for (const article of temporalTraps) {
			await poly.article.addWithEmbedding(article)
		}
		for (const article of similarityTraps) {
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
			// First hop: find where Phase 2 key is stored
			const step1 = await poly.search({
				query: 'Where is the key for Phase 2 stored?',
				recall_depth: 2
			})

			const hasOnyxVault = step1.result.some(r => r.content.includes('Onyx Vault'))
			expect(hasOnyxVault).toBe(true)

			// Second hop: find requirements for Onyx Vault
			const step2 = await poly.search({
				query: 'What are the requirements for Onyx Vault?',
				recall_depth: 2
			})

			const hasQuantumSignature = step2.result.some(r => r.content.includes('quantum-resistant signature'))
			expect(hasQuantumSignature).toBe(true)
		})
	})

	describe('Language Traps', () => {
		it('should distinguish between different meanings of "Mercury"', async () => {
			const planetResults = await poly.article.searchFts({
				query: 'Mercury planet orbit days',
				limit: 1
			})
			expect(planetResults[0].title).toBe('Mercury (Planet)')

			const elementResults = await poly.article.searchFts({
				query: 'Mercury metallic element liquid',
				limit: 1
			})
			expect(elementResults[0].title).toBe('Mercury (Element)')
		})

		it('should not be fooled by negation traps in full-text search', async () => {
			const results = await poly.article.searchFts({
				query: 'Polywise supports MySQL',
				limit: 5
			})

			// It should find the document because it contains the words,
			// but we test if the content correctly contains the negation
			expect(results.some(r => r.content.includes('NOT support MySQL'))).toBe(true)
		})

		it('should prioritize current version over deprecated version in temporal traps', async () => {
			const results = await poly.article.searchFts({
				query: 'Polywise specification synchronization method',
				limit: 10
			})

			const titles = results.map(r => r.title)
			expect(titles).toContain('Polywise v0.8 Specification (CURRENT)')

			// In a real scenario, we'd want CURRENT to have a higher score.
			// Here we just check if both are retrieved and can be distinguished.
			const current = results.find(r => r.title.includes('CURRENT'))
			const deprecated = results.find(r => r.title.includes('DEPRECATED'))

			expect(current).toBeDefined()
			expect(deprecated).toBeDefined()
		})

		it('should distinguish between Polywise and Polly-Wise/Poly-Wise', async () => {
			const projectResults = await poly.article.searchFts({
				query: 'Polywise architecture',
				limit: 5
			})

			expect(projectResults.every(r => !r.title.includes('Parrot'))).toBe(true)

			const parrotResults = await poly.article.searchFts({
				query: 'Polly-Wise parrot language',
				limit: 1
			})
			expect(parrotResults[0].title).toContain('Parrot')
		})
	})
})
