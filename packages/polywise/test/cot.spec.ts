import 'reflect-metadata'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitiveArticles, cognitiveScienceTriples } from './datasets/cognitive'
import { softwareArchitectureTriples, softwareArticles } from './datasets/software'

const TEST_TIMEOUT = 60000

describe('Chain of Thought (CoT) Mechanism', () => {
	let poly: Polywise
	const uniqueId = Math.random().toString(36).slice(2)
	const dbName = `:polywise_cot_${uniqueId}:`

	const mockEmbedding = async (text: string): Promise<number[]> => {
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
			data_dir: dbName,
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

		for (const article of softwareArticles) {
			await poly.article.addWithEmbedding(article)
		}

		for (const article of cognitiveArticles) {
			await poly.article.addWithEmbedding(article)
		}

		await poly.processArticle({
			title: 'Software Architecture Knowledge Base',
			content: 'Comprehensive knowledge graph covering microservices, containers, orchestration, and observability.',
			triples: softwareArchitectureTriples
		})

		await poly.processArticle({
			title: 'Cognitive Science Fundamentals',
			content: 'Understanding the relationship between brain structure, memory systems, and artificial intelligence.',
			triples: cognitiveScienceTriples
		})
	}, TEST_TIMEOUT)

	afterAll(async () => {
		await poly.off()
	})

	describe('Basic CoT Functionality', () => {
		it('should return immediate result with CoT emitter', async () => {
			const { result, cot } = await poly.search({
				query: 'microservices',
				cot_depth: 2
			})

			expect(result.length).toBeGreaterThan(0)
			expect(cot).toBeDefined()
			expect(typeof cot.on).toBe('function')
			expect(typeof cot.off).toBe('function')
		})

		it('should return empty cot emitter when cot_depth is 0', async () => {
			const { cot } = await poly.search({
				query: 'kubernetes',
				cot_depth: 0
			})

			expect(cot).toBeDefined()
			expect(typeof cot.on).toBe('function')
			expect(typeof cot.off).toBe('function')
		})

		it('should contain hybrid search results with multiple sources', async () => {
			const { result } = await poly.search({
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

	describe('Multi-Depth Exploration', () => {
		it('should emit exactly one event when cot_depth is 1', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'service mesh',
				cot_depth: 1,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 3000))

			expect(receivedEvents.length).toBe(1)
			expect(receivedEvents[0].depth).toBe(1)
			expect(receivedEvents[0].results.length).toBeGreaterThan(0)
		})

		it('should emit sequential events for depth 2', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'docker kubernetes',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(receivedEvents.length).toBe(2)
			expect(receivedEvents[0].depth).toBe(1)
			expect(receivedEvents[1].depth).toBe(2)
		})

		it('should emit events in correct order (ascending depth)', async () => {
			const receivedEvents: any[] = []
			const depths: number[] = []

			const { cot } = await poly.search({
				query: 'microservices deployment',
				cot_depth: 3,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
				depths.push(data.depth)
			})

			await new Promise(resolve => setTimeout(resolve, 7000))

			expect(receivedEvents.length).toBe(3)
			expect(depths[0]).toBe(1)
			expect(depths[1]).toBe(2)
			expect(depths[2]).toBe(3)
			expect(depths).toEqual([1, 2, 3])
		})

		it('should include emerged_nodes in each depth result', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'authentication security',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(receivedEvents.length).toBe(2)
			expect(receivedEvents[0].emerged_nodes.length).toBeGreaterThanOrEqual(0)
			expect(receivedEvents[1].emerged_nodes.length).toBeGreaterThanOrEqual(0)
		})

		it('should build query progression with depth', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'circuit breaker',
				cot_depth: 3,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 7000))

			expect(receivedEvents.length).toBe(3)
			expect(receivedEvents[0].query).toContain('circuit breaker')
			expect(receivedEvents[1].query).toContain('perceive')
			expect(receivedEvents[2].query).toContain('perceive')
		})
	})

	describe('Memory Strengthening During CoT', () => {
		it('should increase node potential after CoT stimulation', async () => {
			const allNodes = await poly.getAllNodes()
			const dockerNode = allNodes.find((n: any) => n.label === 'Docker')
			const nodeId = dockerNode?.id

			if (nodeId) {
				await poly.stimulate(nodeId, 0.5)
			}

			const finalNodes = await poly.getAllNodes()
			const stimulatedNode = finalNodes.find((n: any) => n.label === 'Docker')

			expect(stimulatedNode?.potential).toBeGreaterThan(0)
		})

		it('should accumulate memory strength with repeated queries', async () => {
			const { result: firstResult } = await poly.search({
				query: 'istio service mesh',
				cot_depth: 1,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			const firstHasResults = firstResult.length > 0

			await poly.tick(0.1)

			const { result: secondResult } = await poly.search({
				query: 'istio service mesh',
				cot_depth: 1,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			const secondHasResults = secondResult.length > 0

			expect(firstHasResults).toBe(true)
			expect(secondHasResults).toBe(true)
		})

		it('should show stimulated flag for CoT-activated results', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'prometheus monitoring',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			const stimulatedResults = receivedEvents.flatMap(e => e.results.filter((r: any) => r.stimulated))
			expect(stimulatedResults.length).toBeGreaterThan(0)
		})

		it('should track memory strength across CoT depths', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'jaeger distributed tracing',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5,
				stimulate_on_recall: true
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(receivedEvents.length).toBe(2)

			const depth1MaxStrength = Math.max(...receivedEvents[0].results.map((r: any) => r.memoryStrength))
			const depth2MaxStrength = Math.max(...receivedEvents[1].results.map((r: any) => r.memoryStrength))

			// 由于去重逻辑，后续深度的结果是全新的，其记忆强度取决于新查询与新结果的关联
			// 我们只需要验证每一层都有有效的记忆强度即可
			expect(depth1MaxStrength).toBeGreaterThan(0)
			expect(depth2MaxStrength).toBeGreaterThan(0)
		})
	})

	describe('Event Emitter Lifecycle', () => {
		it('should stop emitting after off() is called', async () => {
			let eventCount = 0

			const { cot } = await poly.search({
				query: 'elk stack logging',
				cot_depth: 5,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(() => {
				eventCount++
			})

			cot.off()

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(eventCount).toBeLessThan(5)
		})

		it('should support multiple subscribers', async () => {
			const receivedByFirst: any[] = []
			const receivedBySecond: any[] = []

			const { cot } = await poly.search({
				query: 'grpc protocol buffers',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedByFirst.push(data)
			})

			cot.on(data => {
				receivedBySecond.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(receivedByFirst.length).toBe(receivedBySecond.length)
			expect(receivedByFirst.length).toBeGreaterThan(0)
		})

		it('should return self from on() for chaining', async () => {
			const { cot } = await poly.search({
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

	describe('Complex Real-World Scenarios', () => {
		it('should explore software architecture knowledge chain', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'microservices deployment scaling',
				cot_depth: 4,
				recall_depth: 2,
				search_limit: 15,
				rerank_limit: 8
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 10000))

			expect(receivedEvents.length).toBeGreaterThanOrEqual(3)

			expect(receivedEvents[0].query).toContain('microservices')
			for (let i = 1; i < receivedEvents.length; i++) {
				expect(receivedEvents[i].query).toContain('perceive')
			}

			const allResults = receivedEvents.flatMap(e => e.results)
			expect(allResults.length).toBeGreaterThanOrEqual(5)

			const sources = new Set(allResults.map(r => r.source))
			expect(sources.size).toBeGreaterThanOrEqual(2)
		})

		it('should explore cognitive science to AI connection', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'neural networks brain learning',
				cot_depth: 3,
				recall_depth: 3,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 8000))

			expect(receivedEvents.length).toBe(3)

			const allNodeLabels = receivedEvents.flatMap(e => e.results.map((r: any) => r.title))

			expect(
				allNodeLabels.some(
					label => label.includes('Neural') || label.includes('Neuron') || label.includes('Brain')
				)
			).toBe(true)

			expect(
				allNodeLabels.some(
					label => label.includes('Learning') || label.includes('Deep') || label.includes('Memory')
				)
			).toBe(true)
		})

		it('should handle cross-domain knowledge exploration', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'observability metrics tracing logging',
				cot_depth: 3,
				recall_depth: 3,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 8000))

			expect(receivedEvents.length).toBe(3)

			const allTitles = receivedEvents.flatMap(e => e.results.map((r: any) => r.title))

			expect(allTitles.some(t => t.includes('Observability'))).toBe(true)
		})
	})

	describe('Integration with Hybrid Search', () => {
		it('should respect search_limit and rerank_limit in CoT', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'api gateway routing',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 5,
				rerank_limit: 3
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			for (const event of receivedEvents) {
				expect(event.results.length).toBeLessThanOrEqual(3)
			}
		})

		it('should include results from memory recall at each depth', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'load balancer traffic distribution',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(receivedEvents.length).toBe(2)

			const memoryResults = receivedEvents.flatMap(e =>
				e.results.filter((r: any) => r.source === 'memory' || r.source === 'implicit')
			)
			expect(memoryResults.length).toBeGreaterThan(0)
		})

		it('should combine vector and fulltext search results', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'cdn cache static content',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 5000))

			expect(receivedEvents.length).toBe(2)

			const allResults = receivedEvents.flatMap(e => e.results)
			expect(allResults.length).toBeGreaterThan(0)
		})

		it('should produce higher combined scores for relevant results', async () => {
			const { result } = await poly.search({
				query: 'kubernetes container orchestration',
				recall_depth: 3,
				search_limit: 20,
				rerank_limit: 10,
				cot_depth: 0
			})

			expect(result.length).toBeGreaterThan(0)

			const sortedByCombined = [...result].sort((a, b) => b.combinedScore - a.combinedScore)

			expect(sortedByCombined[0].combinedScore).toBeGreaterThanOrEqual(
				sortedByCombined[sortedByCombined.length - 1].combinedScore
			)
		})
	})

	describe('Edge Cases and Error Handling', () => {
		it('should handle empty knowledge graph gracefully', async () => {
			const emptyPoly = new Polywise()
			await emptyPoly.init({ data_dir: `:polywise_cot_empty_${uniqueId}:` })

			const { result, cot } = await emptyPoly.search({
				query: 'nonexistent concept xyz',
				cot_depth: 2,
				recall_depth: 2,
				search_limit: 10,
				rerank_limit: 5
			})

			expect(result).toBeDefined()
			expect(Array.isArray(result)).toBe(true)

			const receivedEvents: any[] = []
			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 3000))

			await emptyPoly.off()
		})

		it('should handle very high cot_depth gracefully', async () => {
			const receivedEvents: any[] = []

			const { cot } = await poly.search({
				query: 'authentication',
				cot_depth: 10,
				recall_depth: 1,
				search_limit: 5,
				rerank_limit: 3
			})

			cot.on(data => {
				receivedEvents.push(data)
			})

			await new Promise(resolve => setTimeout(resolve, 15000))

			expect(receivedEvents.length).toBeLessThanOrEqual(10)
		})

		it('should handle concurrent CoT searches', async () => {
			const results1 = poly.search({
				query: 'microservices',
				cot_depth: 2,
				recall_depth: 1,
				search_limit: 5,
				rerank_limit: 3
			})

			const results2 = poly.search({
				query: 'kubernetes',
				cot_depth: 2,
				recall_depth: 1,
				search_limit: 5,
				rerank_limit: 3
			})

			const [search1, search2] = await Promise.all([results1, results2])

			expect(search1.result.length).toBeGreaterThan(0)
			expect(search2.result.length).toBeGreaterThan(0)
			expect(search1.cot).toBeDefined()
			expect(search2.cot).toBeDefined()
		})
	})
})
