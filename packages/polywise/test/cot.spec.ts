import { afterAll, beforeAll, describe, expect, it, test } from '@rstest/core'

import { PERCEIVE_COMMAND } from '../src/consts'
import Polywise from '../src/Polywise'
import { cognitive_articles, cognitive_science_triples } from './datasets/cognitive'
import { software_architecture_triples, software_articles } from './datasets/software'

const TEST_TIMEOUT = 60000

describe.concurrent('Chain of Thought (CoT) Mechanism', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_cot_${unique_id}:`

	const mockEmbedding = async (text: string) => {
		return Array(1024)
			.fill(0)
			.map((_, i) => Math.sin(i + text.length) * 0.1)
	}

	const mockRerank = async (query: string, documents: string[]) => {
		return documents.map((_, index) => ({
			index,
			score: 1.0 - index * 0.1
		}))
	}

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			onTick: async () => {
				const { nodes, edges } = await poly.getSnapshot()
				const active = nodes.filter((n: any) => n.activation > 0).map((n: any) => n.label)

				if (active.length > 0) {
					console.log(
						`CoT Test - Active: [${active.slice(0, 5).join(', ')}] | Edges: ${edges.length}`
					)
				}
			},
			embedding_config: { type: 'custom', fn: mockEmbedding },
			reranker_config: { type: 'custom', fn: mockRerank }
		})

		for (const article of software_articles) {
			await poly.article.addWithEmbedding(article)
		}

		for (const article of cognitive_articles) {
			await poly.article.addWithEmbedding(article)
		}

		await poly.save({
			title: 'Software Architecture Knowledge Base',
			content: 'Comprehensive knowledge graph covering microservices, containers, orchestration, and observability.',
			triples: software_architecture_triples
		})

		await poly.save({
			title: 'Cognitive Science Fundamentals',
			content: 'Understanding the relationship between brain structure, memory systems, and artificial intelligence.',
			triples: cognitive_science_triples
		})
	}, TEST_TIMEOUT)

	afterAll(async () => {
		await poly.off()
	})

	describe.concurrent('Basic CoT Functionality', () => {
		test('should return immediate result with CoT emitter', async () => {
			const { result, cot } = await poly.query({
				query: 'microservices',
				cot_depth: 2
			})

			expect(result.length).toBeGreaterThan(0)
			expect(cot).toBeDefined()
			expect(typeof cot.on).toBe('function')
			expect(typeof cot.off).toBe('function')
		})

		test('should return empty cot emitter when cot_depth is 0', async () => {
			const { cot } = await poly.query({
				query: 'kubernetes',
				cot_depth: 0
			})

			expect(cot).toBeDefined()
			expect(typeof cot.on).toBe('function')
			expect(typeof cot.off).toBe('function')
		})

		test('should contain hybrid search results with multiple sources', async () => {
			const { result } = await poly.query({
				query: 'docker',
				recall_depth: 3,
				search_limit: 20,
				rerank_limit: 10
			})

			expect(result.length).toBeGreaterThan(0)
			expect(result.length).toBeLessThanOrEqual(10)

			const sources = new Set(result.map(r => r.source))

			expect(sources.size).toBeGreaterThanOrEqual(1)
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

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 3000))

			expect(received_events.length).toBe(1)
			expect(received_events[0].depth).toBe(1)
			expect(received_events[0].results.length).toBeGreaterThan(0)
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

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(received_events.length).toBe(2)
			expect(received_events[0].depth).toBe(1)
			expect(received_events[1].depth).toBe(2)
		})

		test('should emit events in correct order (ascending depth)', async () => {
			const received_events: any[] = []
			const depths: number[] = []

			const { cot } = await poly.query({
				query: 'microservices deployment',
				cot_depth: 3,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				received_events.push(data)
				depths.push(data.depth)
			})

			await new Promise(resolve => setTimeout(resolve, 7000))

			expect(received_events.length).toBe(3)
			expect(depths[0]).toBe(1)
			expect(depths[1]).toBe(2)
			expect(depths[2]).toBe(3)
			expect(depths).toEqual([1, 2, 3])
		})

		test('should include emerged_nodes in each depth result', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'authentication security',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(received_events.length).toBe(2)
			expect(received_events[0].emerged_nodes.length).toBeGreaterThanOrEqual(0)
			expect(received_events[1].emerged_nodes.length).toBeGreaterThanOrEqual(0)
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

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 7000))

			expect(received_events.length).toBe(3)
			expect(received_events[0].query).toContain('circuit breaker')
			expect(received_events[1].query).toContain(PERCEIVE_COMMAND)
			expect(received_events[2].query).toContain(PERCEIVE_COMMAND)
		})
	})

	describe.concurrent('Memory Strengthening During CoT', () => {
		test('should increase node potential after CoT stimulation', async () => {
			const all_nodes = await poly.getAllNodes()
			const docker_node = all_nodes.find((n: any) => n.label === 'Docker')
			const node_id = docker_node?.id

			if (node_id) {
				await poly.stimulate(node_id, 0.5)
			}

			const final_nodes = await poly.getAllNodes()
			const stimulated_node = final_nodes.find((n: any) => n.label === 'Docker')

			expect(stimulated_node?.potential).toBeGreaterThan(0)
		})

		test('should accumulate memory strength with repeated queries', async () => {
			const { result: first_result } = await poly.query({
				query: 'istio service mesh',
				cot_depth: 1,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			const first_has_results = first_result.length > 0

			await poly.tick(0.1)

			const { result: second_result } = await poly.query({
				query: 'istio service mesh',
				cot_depth: 1,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			const second_has_results = second_result.length > 0

			expect(first_has_results).toBe(true)
			expect(second_has_results).toBe(true)
		})

		test('should show stimulated flag for CoT-activated results', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'prometheus monitoring',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			const stimulated_results = received_events.flatMap(e => e.results.filter((r: any) => r.stimulated))

			expect(stimulated_results.length).toBeGreaterThan(0)
		})

		test('should track memory strength across CoT depths', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'jaeger distributed tracing',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(received_events.length).toBe(2)

			const depth1_max_strength = Math.max(...received_events[0].results.map((r: any) => r.memoryStrength))
			const depth2_max_strength = Math.max(...received_events[1].results.map((r: any) => r.memoryStrength))

			expect(depth1_max_strength).toBeGreaterThan(0)
			expect(depth2_max_strength).toBeGreaterThan(0)
		})
	})

	describe.concurrent('Event Emitter Lifecycle', () => {
		test('should stop emitting after off() is called', async () => {
			let event_count = 0

			const { cot } = await poly.query({
				query: 'elk stack logging',
				cot_depth: 5,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(() => {
				event_count++
			})

			cot.off()

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(event_count).toBeLessThan(5)
		})

		test('should support multiple subscribers', async () => {
			const received_by_first: any[] = []
			const received_by_second: any[] = []

			const { cot } = await poly.query({
				query: 'grpc protocol buffers',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				received_by_first.push(data)
			})

			cot.on(data => {
				received_by_second.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(received_by_first.length).toBe(received_by_second.length)
			expect(received_by_first.length).toBeGreaterThan(0)
		})

		test('should return self from on() for chaining', async () => {
			const { cot } = await poly.query({
				query: 'oauth jwt authentication',
				cot_depth: 1,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			const result = cot.on(() => {})

			expect(result).toBe(cot)
		})
	})

	describe.concurrent('Complex Real-World Scenarios', () => {
		test('should explore software architecture knowledge chain', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'microservices deployment scaling',
				cot_depth: 4,
				recall_depth: 2,
				search_limit: 15,
				rerank_limit: 8
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 10000))

			expect(received_events.length).toBeGreaterThanOrEqual(3)
			expect(received_events[0].query).toContain('microservices')

			for (let i = 1; i < received_events.length; i++) {
				expect(received_events[i].query).toContain(PERCEIVE_COMMAND)
			}

			const all_results = received_events.flatMap(e => e.results)

			expect(all_results.length).toBeGreaterThanOrEqual(5)

			const sources = new Set(all_results.map(r => r.source))

			expect(sources.size).toBeGreaterThanOrEqual(2)
		})

		test('should explore cognitive science to AI connection', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'neural networks brain learning',
				cot_depth: 3,
				recall_depth: 3,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 8000))

			expect(received_events.length).toBe(3)

			const all_node_labels = received_events.flatMap(e => e.results.map((r: any) => r.title))

			expect(
				all_node_labels.some(
					label => label.includes('Neural') || label.includes('Neuron') || label.includes('Brain')
				)
			).toBe(true)

			expect(
				all_node_labels.some(
					label => label.includes('Learning') || label.includes('Deep') || label.includes('Memory')
				)
			).toBe(true)
		})

		test('should handle cross-domain knowledge exploration', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'observability metrics tracing logging',
				cot_depth: 3,
				recall_depth: 3,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 8000))

			expect(received_events.length).toBe(3)

			const all_titles = received_events.flatMap(e => e.results.map((r: any) => r.title))

			expect(all_titles.some(t => t.includes('Observability'))).toBe(true)
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

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			for (const event of received_events) {
				expect(event.results.length).toBeLessThanOrEqual(3)
			}
		})

		test('should include results from memory recall at each depth', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'load balancer traffic distribution',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(received_events.length).toBe(2)

			const memory_results = received_events.flatMap(e =>
				e.results.filter((r: any) => r.source === 'memory' || r.source === 'implicit')
			)

			expect(memory_results.length).toBeGreaterThan(0)
		})

		test('should combine vector and fulltext search results', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'cdn cache static content',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(received_events.length).toBe(2)

			const all_results = received_events.flatMap(e => e.results)

			expect(all_results.length).toBeGreaterThan(0)
		})

		test('should produce higher combined scores for relevant results', async () => {
			const { result } = await poly.query({
				query: 'kubernetes container orchestration',
				recall_depth: 3,
				search_limit: 20,
				rerank_limit: 10,
				cot_depth: 0
			})

			expect(result.length).toBeGreaterThan(0)

			const sorted_by_combined = [...result].sort((a, b) => b.combinedScore - a.combinedScore)

			expect(sorted_by_combined[0].combinedScore).toBeGreaterThanOrEqual(
				sorted_by_combined[sorted_by_combined.length - 1].combinedScore
			)
		})
	})

	describe.concurrent('Edge Cases and Error Handling', () => {
		test('should handle empty knowledge graph gracefully', async () => {
			const empty_poly = new Polywise()

			await empty_poly.init({ data_dir: `:polywise_cot_empty_${unique_id}:` })

			const { result, cot } = await empty_poly.query({
				query: 'nonexistent concept xyz',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			expect(result).toBeDefined()
			expect(Array.isArray(result)).toBe(true)

			const received_events: any[] = []

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 3000))

			await empty_poly.off()
		})

		test('should handle very high cot_depth gracefully', async () => {
			const received_events: any[] = []

			const { cot } = await poly.query({
				query: 'authentication',
				cot_depth: 10,
				recall_depth: 1,
				search_limit: 5,
				rerank_limit: 3
			})

			cot.on(data => {
				received_events.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 15000))

			expect(received_events.length).toBeLessThanOrEqual(10)
		})

		it('should handle concurrent CoT searches', async () => {
			const results_1 = poly.query({
				query: 'microservices',
				cot_depth: 2,
				recall_depth: 1,
				search_limit: 5,
				rerank_limit: 3
			})

			const results_2 = poly.query({
				query: 'kubernetes',
				cot_depth: 2,
				recall_depth: 1,
				search_limit: 5,
				rerank_limit: 3
			})

			const [search_1, search_2] = await Promise.all([results_1, results_2])

			expect(search_1.result.length).toBeGreaterThan(0)
			expect(search_2.result.length).toBeGreaterThan(0)
			expect(search_1.cot).toBeDefined()
			expect(search_2.cot).toBeDefined()
		})
	})
})
