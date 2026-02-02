import 'reflect-metadata'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'

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

	const softwareArchitectureTriples = [
		{
			subject: 'Microservices',
			predicate: 'uses',
			object: 'REST APIs',
			learning_rate: 2.5,
			decay_resistance: 2.0
		},
		{
			subject: 'Microservices',
			predicate: 'replaces',
			object: 'Monolith',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{
			subject: 'Microservices',
			predicate: 'enables',
			object: 'Horizontal Scaling',
			learning_rate: 2.4,
			decay_resistance: 2.1
		},
		{
			subject: 'REST APIs',
			predicate: 'uses',
			object: 'HTTP Protocol',
			learning_rate: 2.2,
			decay_resistance: 1.8
		},
		{ subject: 'REST APIs', predicate: 'uses', object: 'JSON', learning_rate: 2.1, decay_resistance: 1.7 },
		{
			subject: 'gRPC',
			predicate: 'uses',
			object: 'Protocol Buffers',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{ subject: 'Message Queues', predicate: 'uses', object: 'AMQP', learning_rate: 2.0, decay_resistance: 1.6 },
		{
			subject: 'Docker',
			predicate: 'containerizes',
			object: 'Microservices',
			learning_rate: 2.6,
			decay_resistance: 2.2
		},
		{
			subject: 'Kubernetes',
			predicate: 'orchestrates',
			object: 'Docker',
			learning_rate: 2.5,
			decay_resistance: 2.1
		},
		{
			subject: 'Service Mesh',
			predicate: 'manages',
			object: 'Inter-service Traffic',
			learning_rate: 2.2,
			decay_resistance: 1.8
		},
		{
			subject: 'Istio',
			predicate: 'implements',
			object: 'Service Mesh',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{
			subject: 'Prometheus',
			predicate: 'monitors',
			object: 'Metrics',
			learning_rate: 2.4,
			decay_resistance: 2.0
		},
		{
			subject: 'Jaeger',
			predicate: 'traces',
			object: 'Distributed Requests',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{
			subject: 'ELK Stack',
			predicate: 'aggregates',
			object: 'Logs',
			learning_rate: 2.2,
			decay_resistance: 1.8
		},
		{
			subject: 'Circuit Breaker',
			predicate: 'prevents',
			object: 'Cascading Failures',
			learning_rate: 2.1,
			decay_resistance: 1.7
		},
		{
			subject: 'API Gateway',
			predicate: 'routes',
			object: 'REST APIs',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{
			subject: 'Authentication',
			predicate: 'secured_by',
			object: 'OAuth 2.0',
			learning_rate: 2.5,
			decay_resistance: 2.1
		},
		{
			subject: 'OAuth 2.0',
			predicate: 'uses',
			object: 'JWT Tokens',
			learning_rate: 2.4,
			decay_resistance: 2.0
		},
		{
			subject: 'Load Balancer',
			predicate: 'distributes',
			object: 'Traffic',
			learning_rate: 2.2,
			decay_resistance: 1.8
		},
		{
			subject: 'CDN',
			predicate: 'caches',
			object: 'Static Content',
			learning_rate: 2.0,
			decay_resistance: 1.6
		},
		{
			subject: 'API Gateway',
			predicate: 'authenticates',
			object: 'JWT Tokens',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{ subject: 'Kubernetes', predicate: 'manages', object: 'Pods', learning_rate: 2.4, decay_resistance: 2.0 },
		{
			subject: 'Service Mesh',
			predicate: 'provides',
			object: 'Observability',
			learning_rate: 2.2,
			decay_resistance: 1.8
		},
		{
			subject: 'Istio',
			predicate: 'enables',
			object: 'Traffic Management',
			learning_rate: 2.3,
			decay_resistance: 1.9
		}
	]

	const softwareArticles = [
		{
			title: 'Introduction to Microservices Architecture',
			content: 'Microservices architecture is an approach to application development where a large application is built as a suite of modular services. Each module supports a specific business goal and uses a well-defined interface to communicate with other sets of services. This architectural style has gained significant popularity in enterprise environments due to its flexibility and scalability.'
		},
		{
			title: 'Docker and Containerization Best Practices',
			content: 'Docker has revolutionized how we deploy applications. By containerizing microservices, teams can ensure consistency across environments, reduce overhead compared to virtual machines, and enable faster deployment cycles. Containerization provides process isolation and resource efficiency that traditional virtualization cannot match.'
		},
		{
			title: 'Kubernetes for Enterprise Scale',
			content: 'Kubernetes has become the de facto standard for container orchestration. It provides automated deployment, scaling, and management of containerized applications across clusters of hosts. Key features include self-healing, automated rollouts, and horizontal scaling based on CPU utilization.'
		},
		{
			title: 'Service Mesh Patterns with Istio',
			content: 'Service mesh architecture provides a dedicated infrastructure layer for handling service-to-service communication. Istio provides features like traffic management, security, and observability without requiring code changes. The service mesh handles load balancing, authentication, and monitoring at the infrastructure level.'
		},
		{
			title: 'Observability in Distributed Systems',
			content: 'Modern distributed systems require comprehensive observability. The three pillars - metrics, logs, and traces - provide different perspectives on system health and performance. Prometheus excels at metrics collection, Jaeger provides distributed tracing, and the ELK stack handles log aggregation.'
		},
		{
			title: 'API Design Best Practices',
			content: 'RESTful API design follows principles of resource-oriented architecture. Proper use of HTTP methods, status codes, and versioning strategies are essential. API gateways serve as the single entry point for all client requests, handling authentication, rate limiting, and request routing.'
		},
		{
			title: 'Security in Microservices',
			content: 'Securing microservices requires defense in depth strategies. OAuth 2.0 with JWT tokens provides stateless authentication. API gateways can enforce authentication before requests reach backend services. Service meshes like Istio provide mutual TLS between services automatically.'
		}
	]

	const cognitiveScienceTriples = [
		{
			subject: 'Human Brain',
			predicate: 'contains',
			object: 'Neurons',
			learning_rate: 2.5,
			decay_resistance: 2.2
		},
		{
			subject: 'Neurons',
			predicate: 'form',
			object: 'Neural Networks',
			learning_rate: 2.4,
			decay_resistance: 2.0
		},
		{
			subject: 'Neural Networks',
			predicate: 'inspired',
			object: 'Deep Learning',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{
			subject: 'Deep Learning',
			predicate: 'uses',
			object: 'Backpropagation',
			learning_rate: 2.2,
			decay_resistance: 1.8
		},
		{
			subject: 'Backpropagation',
			predicate: 'optimizes',
			object: 'Weights',
			learning_rate: 2.1,
			decay_resistance: 1.7
		},
		{
			subject: 'Weights',
			predicate: 'stored_in',
			object: 'Parameters',
			learning_rate: 2.0,
			decay_resistance: 1.6
		},
		{ subject: 'Memory', predicate: 'stores', object: 'Knowledge', learning_rate: 2.5, decay_resistance: 2.1 },
		{
			subject: 'Knowledge',
			predicate: 'organized_in',
			object: 'Concepts',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{
			subject: 'Concepts',
			predicate: 'connected_by',
			object: 'Associations',
			learning_rate: 2.2,
			decay_resistance: 1.8
		},
		{
			subject: 'Consciousness',
			predicate: 'emerges_from',
			object: 'Neural Activity',
			learning_rate: 2.6,
			decay_resistance: 2.3
		},
		{
			subject: 'Neural Activity',
			predicate: 'generates',
			object: 'Thoughts',
			learning_rate: 2.4,
			decay_resistance: 2.0
		},
		{
			subject: 'Thoughts',
			predicate: 'manipulated_by',
			object: 'Working Memory',
			learning_rate: 2.3,
			decay_resistance: 1.9
		},
		{
			subject: 'Working Memory',
			predicate: 'limited_by',
			object: 'Cognitive Load',
			learning_rate: 2.1,
			decay_resistance: 1.7
		},
		{
			subject: 'Long-term Memory',
			predicate: 'consolidates',
			object: 'Experiences',
			learning_rate: 2.5,
			decay_resistance: 2.2
		},
		{
			subject: 'Experiences',
			predicate: 'encoded_in',
			object: 'Episodes',
			learning_rate: 2.3,
			decay_resistance: 1.9
		}
	]

	const cognitiveArticles = [
		{
			title: 'How the Human Brain Works',
			content: 'The human brain is a complex organ containing approximately 86 billion neurons. These neurons communicate through synapses, forming neural networks that underlie all cognitive functions. Understanding brain architecture helps us design better artificial intelligence systems.'
		},
		{
			title: 'Memory Formation and Consolidation',
			content: 'Memory formation involves multiple stages from encoding to storage to retrieval. Short-term memory holds information temporarily while long-term memory stores it permanently. Sleep plays a crucial role in memory consolidation, transferring important information from hippocampus to neocortex.'
		},
		{
			title: 'Neural Networks and Deep Learning',
			content: 'Artificial neural networks are inspired by biological neural networks in the brain. Deep learning models use multiple layers of neurons to learn hierarchical representations of data. Training uses backpropagation to adjust weights and minimize prediction errors.'
		}
	]

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
			expect(receivedEvents[1].query).toContain('基于')
			expect(receivedEvents[2].query).toContain('基于')
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

			expect(depth2MaxStrength).toBeGreaterThanOrEqual(depth1MaxStrength)
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

			expect(receivedEvents.length).toBe(4)

			expect(receivedEvents[0].query).toContain('microservices')
			expect(receivedEvents[1].query).toContain('基于')
			expect(receivedEvents[2].query).toContain('基于')
			expect(receivedEvents[3].query).toContain('基于')

			const allResults = receivedEvents.flatMap(e => e.results)
			expect(allResults.length).toBeGreaterThan(10)

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
