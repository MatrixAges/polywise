import { afterAll, beforeAll, describe, expect, it, test } from '@rstest/core'

import { getTestVectors } from '../scripts/getTestVectors'
import { PERCEIVE_COMMAND } from '../src/consts'
import Polywise from '../src/Polywise'
import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'

const TEST_TIMEOUT = 60000

describe.concurrent('Chain of Thought (CoT) Mechanism', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `.test_db/:polywise_cot_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			},
			embedding_concurrency: 20,
			reranker_concurrency: 20,
			onTick: async () => {
				const { nodes, edges } = await poly.getSnapshot()
				const active = nodes.filter((n: any) => n.activation > 0).map((n: any) => n.label)

				if (active.length > 0) {
					console.log(
						`CoT Test - Active: [${active.slice(0, 5).join(', ')}] | Edges: ${edges.length}`
					)
				}
			}
		})

		for (const content of software_architecture_datasets) {
			await poly.article.addWithEmbedding(content)
		}

		for (const content of cognitive_science_datasets) {
			await poly.article.addWithEmbedding(content)
		}

		await poly.save({
			content: 'Comprehensive knowledge graph covering microservices, containers, orchestration, and observability.'
		})

		await poly.save({
			content: 'Understanding the relationship between brain structure, memory systems, and artificial intelligence.'
		})
	}, TEST_TIMEOUT)

	afterAll(async () => {
		await poly.off()
	})

	describe.concurrent('Basic CoT Functionality', () => {
		test('should return immediate result with CoT emitter', async () => {
			const { knowledges, actions, cot } = await poly.query({
				query: 'microservices',
				cot_depth: 2
			})

			expect(knowledges.length + actions.length).toBeGreaterThan(0)
			expect(cot).toBeDefined()
			expect(typeof cot?.on).toBe('function')
			expect(typeof cot?.off).toBe('function')
		})

		test('should return empty cot emitter when cot_depth is 0', async () => {
			const { cot } = await poly.query({
				query: 'kubernetes',
				cot_depth: 0
			})

			expect(cot).toBeDefined()
			expect(typeof cot?.on).toBe('function')
			expect(typeof cot?.off).toBe('function')
		})

		test('should contain hybrid search results', async () => {
			const { knowledges, actions } = await poly.query({
				query: 'docker',
				recall_depth: 3,
				search_limit: 20,
				rerank_limit: 10
			})

			const results = [...knowledges, ...actions]

			expect(results.length).toBeGreaterThan(0)
			expect(results.length).toBeLessThanOrEqual(10)
			expect(typeof results[0]).toBe('string')
		})
	})

	describe.concurrent('Multi-Depth Exploration', () => {
		test('should emit exactly one event when cot_depth is 1', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'service mesh',
				cot_depth: 1,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot?.on(data => {
				received_events.push(data)
			})

			await cot?.toPromise()

			expect(received_events.length).toBe(1)
			expect(received_events[0].knowledges.length + received_events[0].actions.length).toBeGreaterThan(0)
		})

		test('should emit sequential events for depth 2', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'docker kubernetes',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot?.on(data => {
				received_events.push(data)
			})

			await cot?.toPromise()

			expect(received_events.length).toBe(2)
		})

		test('should emit events in correct order (ascending depth)', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'microservices deployment',
				cot_depth: 3,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot?.on(data => {
				received_events.push(data)
			})

			await cot?.toPromise()

			expect(received_events.length).toBe(3)
		})

		test('should include metadata in each depth result', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'authentication security',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot?.on(data => {
				received_events.push(data)
			})

			await cot?.toPromise()

			expect(received_events.length).toBe(2)
			expect(typeof received_events[0].metadata).toBe('object')
			expect(typeof received_events[1].metadata).toBe('object')
		})

		test('should build query progression with depth', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'circuit breaker',
				cot_depth: 3,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot?.on(data => {
				received_events.push(data)
			})

			await cot?.toPromise()

			expect(received_events.length).toBe(3)
		})
	})

	describe.concurrent('Integration with Hybrid Search', () => {
		test('should respect search_limit and rerank_limit in CoT', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'api gateway routing',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 5,
				rerank_limit: 3
			})

			cot?.on(data => {
				received_events.push(data)
			})

			await cot?.toPromise()

			for (const event of received_events) {
				expect(event.knowledges.length + event.actions.length).toBeLessThanOrEqual(3)
			}
		})
	})
})
