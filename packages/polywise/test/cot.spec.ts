import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'
import { getTestRerank, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe('Chain of Thought (CoT) Iterative Search', () => {
	let poly: Polywise
	const db_name = getDataDir()

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			},
			reranker_config: {
				type: 'custom',
				fn: getTestRerank
			},
			embedding_concurrency: 20,
			reranker_concurrency: 20
		})

		// Prepare test data: software architecture documents
		for (const content of software_architecture_datasets.slice(0, 10)) {
			await poly.save({ content })
		}

		// Prepare test data: cognitive science documents (different domain)
		for (const content of cognitive_science_datasets.slice(0, 10)) {
			await poly.save({ content })
		}
	})

	afterAll(async () => {
		await poly.off()
	})

	describe('Single Search (cot_depth=1)', () => {
		it('should find relevant microservices content', async () => {
			const { memory } = await poly.query({
				query: 'microservices architecture patterns',
				cot_depth: 1,
				search_limit: 5,
				rerank_limit: 5
			})

			const all_text = memory.join(' ').toLowerCase()
			const has_microservices = all_text.includes('microservice')
			const has_architecture = all_text.includes('architecture')
			const has_container = all_text.includes('container') || all_text.includes('docker')

			const relevant_keywords = [has_microservices, has_architecture, has_container].filter(Boolean).length
			expect(relevant_keywords).toBeGreaterThanOrEqual(2)
			expect(memory.length).toBeGreaterThan(0)
		})

		it('should filter out neuroscience content when searching for software', async () => {
			const { memory } = await poly.query({
				query: 'API gateway and service mesh',
				cot_depth: 1,
				search_limit: 5,
				rerank_limit: 5
			})

			const all_text = memory.join(' ').toLowerCase()
			const has_neuroscience =
				all_text.includes('neuron') || all_text.includes('brain') || all_text.includes('synapse')

			const has_software =
				all_text.includes('service') || all_text.includes('api') || all_text.includes('gateway')

			expect(has_neuroscience).toBe(false)
			expect(has_software).toBe(true)
		})
	})

	describe('Iterative Search (cot_depth=3)', () => {
		it('should find more comprehensive results than single search', async () => {
			const single_result = await poly.query({
				query: 'container orchestration',
				cot_depth: 1,
				search_limit: 5,
				rerank_limit: 5
			})

			const iterative_result = await poly.query({
				query: 'container orchestration',
				cot_depth: 3,
				search_limit: 5,
				rerank_limit: 5
			})

			expect(iterative_result.memory.length).toBeGreaterThanOrEqual(single_result.memory.length)

			const all_text = iterative_result.memory.join(' ').toLowerCase()
			const has_docker = all_text.includes('docker') || all_text.includes('container')
			const has_kubernetes = all_text.includes('kubernetes') || all_text.includes('k8s')
			const has_orchestration = all_text.includes('orchestr')

			const aspects = [has_docker, has_kubernetes, has_orchestration].filter(Boolean).length
			expect(aspects).toBeGreaterThanOrEqual(2)
		})

		it('should maintain relevance across iterations', async () => {
			const { memory } = await poly.query({
				query: 'circuit breaker pattern resilience',
				cot_depth: 3,
				search_limit: 5,
				rerank_limit: 5
			})

			const all_text = memory.join(' ').toLowerCase()

			const has_pattern = all_text.includes('pattern')
			const has_service = all_text.includes('service')
			const has_architecture = all_text.includes('architecture')

			const relevant_keywords = [has_pattern, has_service, has_architecture].filter(Boolean).length
			expect(relevant_keywords).toBeGreaterThanOrEqual(2)
		})
	})

	describe('Content Relevance Quality', () => {
		it('should return neuroscience content when query matches that domain', async () => {
			const { memory } = await poly.query({
				query: 'neural networks and synaptic connections',
				cot_depth: 1,
				search_limit: 5,
				rerank_limit: 5
			})

			const all_text = memory.join(' ').toLowerCase()
			const has_neuroscience =
				all_text.includes('neuron') || all_text.includes('synapse') || all_text.includes('brain')

			const has_software =
				all_text.includes('microservice') || all_text.includes('container') || all_text.includes('api')

			expect(has_neuroscience).toBe(true)
		})

		it('should provide high-quality results with metadata', async () => {
			const { memory, metadata } = await poly.query({
				query: 'distributed system scalability',
				cot_depth: 2,
				search_limit: 5,
				rerank_limit: 5
			})

			expect(memory.length).toBeGreaterThan(0)

			expect(metadata).toBeDefined()

			const all_text = memory.join(' ').toLowerCase()
			const has_distributed = all_text.includes('distribut')
			const has_system = all_text.includes('system')
			const has_scale = all_text.includes('scal')

			const relevant_terms = [has_distributed, has_system, has_scale].filter(Boolean).length
			expect(relevant_terms).toBeGreaterThanOrEqual(2)
		})
	})
})
