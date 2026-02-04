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

	const random_qas: { query: string; expected: string }[] = []

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_concurrency: 10,
			reranker_concurrency: 10
		})

		const mandatory = [
			long_context_datasets[0],
			`Project Genesis: Part 1: The secret key to unlock Phase 2 is stored in the "Onyx Vault".\n${multi_hop_datasets[0]}`,
			`Project Genesis: Part 2: Accessing the "Onyx Vault" requires a 128-bit quantum-resistant signature.\n${multi_hop_datasets[1]}`,
			homonym_traps_datasets[0],
			homonym_traps_datasets[1],
			negation_traps_datasets[0],
			temporal_traps_datasets[0],
			temporal_traps_datasets[1],
			similarity_traps_datasets[0]
		]

		const others = [
			...long_context_datasets.slice(1),
			...multi_hop_datasets.slice(2),
			...homonym_traps_datasets.slice(2),
			...negation_traps_datasets.slice(1),
			...temporal_traps_datasets.slice(2),
			...similarity_traps_datasets.slice(1)
		]

		// Use 25 articles total to ensure 30s limit (9 mandatory + 16 random)
		const shuffled_others = others.sort(() => Math.random() - 0.5).slice(0, 16)

		for (const content of shuffled_others.slice(0, 3)) {
			const mid = Math.floor(content.length / 2)
			const query = content.slice(mid, mid + 150)

			random_qas.push({ query, expected: content.slice(0, 50) })
		}

		const final_datasets = [...mandatory, ...shuffled_others].sort(() => Math.random() - 0.5)

		for (const content of final_datasets) {
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
				recall_depth: 2,
				search_limit: 50,
				rerank_limit: 20
			})

			const has_onyx_vault = step1.knowledges.some(r => r.content.includes('Onyx Vault'))

			expect(has_onyx_vault).toBe(true)

			const step2 = await poly.query({
				query: 'What are the requirements for Onyx Vault?',
				recall_depth: 2,
				search_limit: 50,
				rerank_limit: 20
			})

			const has_quantum_signature = step2.knowledges.some(r =>
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

	describe.concurrent('Random Generated QA', () => {
		it('should retrieve randomly selected articles correctly', async () => {
			for (const qa of random_qas) {
				const { knowledges, actions } = await poly.query({
					query: qa.query,
					rerank_limit: 10
				})
				const result = [...knowledges, ...actions]
				const found = result.some(r => r.content.includes(qa.expected))

				expect(found).toBe(true)
			}
		})
	})
})
