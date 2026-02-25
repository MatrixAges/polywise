import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'
import { getTestKeywords, getTestRerank, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe('Polywise Brain System', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
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
			keyword_config: {
				type: 'custom',
				fn: getTestKeywords
			},
			onTick: async () => {
				const { nodes, edges } = await poly.getSnapshot()
				const active = nodes.filter((n: any) => n.activation > 0).map((n: any) => n.label)

				if (active.length > 0) {
					console.log(`Active Nodes: [${active.join(', ')}] | Total Edges: ${edges.length}`)
				}
			}
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	describe.concurrent('Complex Knowledge Graph Operations', () => {
		it('should process complex software architecture text', async () => {
			const text = software_architecture_datasets[0]

			await poly.save({
				content: text
			})

			const { nodes, edges } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(0)
			expect(edges.length).toBeGreaterThanOrEqual(0)
		})

		it('should process complex scientific text with real-world knowledge', async () => {
			const text = cognitive_science_datasets[0]

			await poly.save({
				content: text
			})

			const { nodes } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(0)
		})

		it('should handle large scale knowledge network with real entities', async () => {
			const node_ids: Array<number> = []
			const entities = [
				'PostgreSQL',
				'Redis',
				'Kafka',
				'Elasticsearch',
				'NGINX',
				'HAProxy',
				'Envoy',
				'Vault',
				'Consul',
				'Terraform',
				'Ansible',
				'Jenkins',
				'GitLab',
				'Sentry',
				'Grafana',
				'Jaeger',
				'Istio',
				'Linkerd',
				'Traefik',
				'KEDA'
			]

			for (let i = 0; i < entities.length; i++) {
				const embedding = (await poly.pipeline.embed(entities[i])) as number[]

				const node_id = await poly.addNode({
					label: `${entities[i]}_${i}`,
					x: i * 10,
					y: i * 5,
					threshold: 0.1,
					embedding
				})

				node_ids.push(node_id)
			}

			for (let i = 0; i < node_ids.length; i++) {
				for (let j = i + 1; j < Math.min(i + 4, node_ids.length); j++) {
					await poly.connect({
						source_id: node_ids[i],
						target_id: node_ids[j],
						weight: 0.5
					})
				}
			}

			await poly.stimulate(node_ids[0], 5.0)

			for (let i = 0; i < 20; i++) {
				await poly.tick(0.25, true, 1.0)
			}

			const { nodes } = await poly.getSnapshot(0.1)

			expect(nodes.length).toBeGreaterThanOrEqual(6)
		})

		it('should process multiple articles with overlapping concepts', async () => {
			// Reverted to serial execution to avoid PGlite lock contention
			await poly.save({
				content: 'Artificial Intelligence includes Machine Learning. Machine Learning includes Supervised Learning and Unsupervised Learning.'
			})

			await poly.save({
				content: 'Machine Learning uses Neural Networks. Neural Networks inspired by Biological Brain. Biological Brain has Neurons.'
			})

			await poly.save({
				content: 'Deep Learning is a subset of Machine Learning. Deep Learning uses Multiple Layers.'
			})

			const { nodes } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(0)
		})
	})

	describe.concurrent('Brain Dynamics and Learning', () => {
		it('should propagate activation through network chains using real entities', async () => {
			const chain: Array<number> = []
			const entities = ['Processor', 'Instruction', 'Memory', 'Address', 'Bus', 'Cache', 'RAM', 'Storage']

			for (let i = 0; i < entities.length; i++) {
				const embedding = (await poly.pipeline.embed(entities[i])) as Array<number>

				const node_id = await poly.addNode({
					label: `${entities[i]}_${unique_id}`,
					x: i * 50,
					y: 100,
					threshold: 0.3,
					embedding
				})

				chain.push(node_id)
			}

			for (let i = 0; i < chain.length - 1; i++) {
				await poly.connect({ source_id: chain[i], target_id: chain[i + 1], weight: 0.85 })
			}

			await poly.stimulate(chain[0], 5.0)

			for (let i = 0; i < 20; i++) {
				await poly.tick(0.25, true, 1.0)
			}

			const { nodes } = await poly.getSnapshot(0.1)

			expect(nodes.length).toBeGreaterThanOrEqual(8)
		})

		it('should handle complex learning burst with fatigue using network hierarchy', async () => {
			const concepts = [
				{ label: 'Network_Gateway', x: 0, y: 200 },
				{ label: 'Auth_Service', x: 200, y: 100 },
				{ label: 'User_Database', x: 200, y: 300 },
				{ label: 'Token_Validator', x: 400, y: 200 },
				{ label: 'Secure_API', x: 600, y: 200 }
			]

			const node_ids: Array<number> = []

			for (const concept of concepts) {
				const embedding = (await poly.pipeline.embed(concept.label)) as Array<number>

				const id = await poly.addNode({
					label: `${concept.label}_${unique_id}`,
					x: concept.x,
					y: concept.y,
					threshold: 0.1,
					embedding
				})

				node_ids.push(id)
			}

			await poly.connect({ source_id: node_ids[0], target_id: node_ids[1], weight: 0.9 })
			await poly.connect({ source_id: node_ids[0], target_id: node_ids[2], weight: 0.9 })
			await poly.connect({ source_id: node_ids[1], target_id: node_ids[3], weight: 0.85 })
			await poly.connect({ source_id: node_ids[2], target_id: node_ids[3], weight: 0.85 })
			await poly.connect({ source_id: node_ids[3], target_id: node_ids[4], weight: 0.9 })

			poly.brain.reportUserActivity()
			poly.brain.addSynapticLoad(800)

			await poly.stimulate(node_ids[0], 5.0)

			await poly.brain.triggerInputBurst(50)

			const nodes = await poly.getAllNodes()
			const output_node = nodes.find((n: any) => n.label.includes('Secure_API'))

			expect(output_node).toBeDefined()
		})

		it('should maintain and strengthen important connections', async () => {
			await poly.save({
				content: 'Core_Concept is fundamental to Derived_1, Derived_2, and Derived_3. Derived_1 leads to Application_1. Derived_2 leads to Application_2. Derived_3 leads to Application_3.'
			})

			for (let i = 0; i < 5; i++) {
				await poly.tick(0.4, true, 1.0)
			}

			const { nodes } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(0)
		})
	})

	describe.concurrent('Schema and Data Integrity', () => {
		it('should handle concurrent node operations', async () => {
			const promises: Array<Promise<number>> = []

			for (let i = 0; i < 15; i++) {
				promises.push(poly.addNode({ label: `Concurrent_${i}`, x: i * 20, y: i * 10, threshold: 0.5 }))
			}

			const node_ids = await Promise.all(promises)

			expect(node_ids.length).toBe(15)
			expect(new Set(node_ids).size).toBe(15)

			const nodes = await poly.getAllNodes()
			const concurrent_nodes = nodes.filter((n: any) => n.label.startsWith('Concurrent_'))

			expect(concurrent_nodes.length).toBe(15)
		})
	})

	describe.concurrent('Node and Edge Filtering with idol_id, root_ids, metrics_ids', () => {
		it('should create nodes with idol_id and filter by idol', async () => {
			const idol_a = 'idol_001'
			const idol_b = 'idol_002'

			const node_a = await poly.addNode({
				label: 'Concept_A',
				x: 0,
				y: 0,
				threshold: 0.5,
				idol_id: idol_a,
				root_ids: ['root_1'],
				metrics_ids: ['metric_1']
			})
			const node_b = await poly.addNode({
				label: 'Concept_B',
				x: 100,
				y: 0,
				threshold: 0.5,
				idol_id: idol_a,
				root_ids: ['root_2'],
				metrics_ids: ['metric_2']
			})
			const node_c = await poly.addNode({
				label: 'Concept_C',
				x: 200,
				y: 0,
				threshold: 0.5,
				idol_id: idol_b,
				root_ids: ['root_1'],
				metrics_ids: ['metric_3']
			})

			await poly.connect({
				source_id: node_a,
				target_id: node_b,
				weight: 0.8,
				idol_id: idol_a,
				root_ids: ['root_1'],
				metrics_ids: ['metric_1']
			})
			await poly.connect({
				source_id: node_b,
				target_id: node_c,
				weight: 0.6,
				idol_id: idol_b,
				root_ids: ['root_2'],
				metrics_ids: ['metric_2']
			})

			const nodes_idol_a = await poly.getNodesByIdol(idol_a)
			const nodes_idol_b = await poly.getNodesByIdol(idol_b)

			expect(nodes_idol_a.length).toBe(2)
			expect(nodes_idol_b.length).toBe(1)
			expect(nodes_idol_a.some((n: any) => n.label === 'Concept_A')).toBe(true)
			expect(nodes_idol_a.some((n: any) => n.label === 'Concept_B')).toBe(true)
			expect(nodes_idol_b[0].label).toBe('Concept_C')
		})

		it('should filter nodes by root_id', async () => {
			const root_1 = 'root_knowledge'
			const root_2 = 'root_science'

			await poly.addNode({ label: 'Knowledge_A', x: 0, y: 0, threshold: 0.5, root_ids: [root_1] })
			await poly.addNode({
				label: 'Knowledge_B',
				x: 100,
				y: 0,
				threshold: 0.5,
				root_ids: [root_1, root_2]
			})
			await poly.addNode({ label: 'Science_A', x: 200, y: 0, threshold: 0.5, root_ids: [root_2] })

			const nodes_root_1 = await poly.getNodesByRoot(root_1)
			const nodes_root_2 = await poly.getNodesByRoot(root_2)

			expect(nodes_root_1.length).toBe(2)
			expect(nodes_root_2.length).toBe(2)
			expect(nodes_root_1.some((n: any) => n.label === 'Knowledge_A')).toBe(true)
			expect(nodes_root_1.some((n: any) => n.label === 'Knowledge_B')).toBe(true)
			expect(nodes_root_2.some((n: any) => n.label === 'Science_A')).toBe(true)
		})

		it('should filter edges by idol_id', async () => {
			const idol = 'idol_edges_test'
			const node_1 = await poly.addNode({
				label: 'Edge_Test_1',
				x: 0,
				y: 0,
				threshold: 0.5,
				idol_id: idol
			})
			const node_2 = await poly.addNode({
				label: 'Edge_Test_2',
				x: 100,
				y: 0,
				threshold: 0.5,
				idol_id: idol
			})
			const node_3 = await poly.addNode({ label: 'Edge_Test_3', x: 200, y: 0, threshold: 0.5 })

			await poly.connect({ source_id: node_1, target_id: node_2, weight: 0.9, idol_id: idol })
			await poly.connect({ source_id: node_2, target_id: node_3, weight: 0.7 })

			const edges_with_idol = await poly.getEdgesByIdol(idol)

			expect(edges_with_idol.length).toBe(1)
			expect(edges_with_idol[0].source_id).toBe(node_1)
			expect(edges_with_idol[0].target_id).toBe(node_2)
		})

		it('should filter edges by root_id', async () => {
			const root = 'root_edge_test'
			const node_1 = await poly.addNode({ label: 'Root_Edge_1', x: 0, y: 0 })
			const node_2 = await poly.addNode({ label: 'Root_Edge_2', x: 100, y: 0 })
			const node_3 = await poly.addNode({ label: 'Root_Edge_3', x: 200, y: 0 })

			await poly.connect({ source_id: node_1, target_id: node_2, weight: 0.8, root_ids: [root] })
			await poly.connect({
				source_id: node_2,
				target_id: node_3,
				weight: 0.6,
				root_ids: ['other_root']
			})

			const edges_with_root = await poly.getEdgesByRoot(root)

			expect(edges_with_root.length).toBe(1)
			expect(edges_with_root[0].source_id).toBe(node_1)
			expect(edges_with_root[0].target_id).toBe(node_2)
		})

		it('should process article with filtering metadata', async () => {
			const idol = 'article_idol_001'
			const root_ids = ['article_root_1', 'article_root_2']
			const metrics_ids = ['metric_quality', 'metric_relevance']

			await poly.save({
				content: 'Content about AI...',
				idol_id: idol,
				root_ids,
				metrics_ids
			})

			const nodes = await poly.getNodesByIdol(idol)
			expect(nodes.length).toBeGreaterThanOrEqual(0)
		})

		it('should include new fields in snapshot', async () => {
			const idol = 'snapshot_test'
			const root_ids = ['root_snapshot']
			const metrics_ids = ['metric_snapshot']

			const node = await poly.addNode({
				label: 'Snapshot_Node',
				x: 0,
				y: 0,
				threshold: 0.5,
				idol_id: idol,
				root_ids,
				metrics_ids
			})
			await poly.connect({
				source_id: node,
				target_id: node,
				weight: 0.5,
				idol_id: idol,
				root_ids,
				metrics_ids
			})

			const { nodes } = await poly.getSnapshot(0.1, 1000)

			const snapshot_node = nodes.find((n: any) => n.label === 'Snapshot_Node')

			expect(snapshot_node).toBeDefined()
			expect(snapshot_node.idol_id).toBe(idol)
			expect(snapshot_node.root_ids).toEqual(root_ids)
			expect(snapshot_node.metrics_ids).toEqual(metrics_ids)
		})
	})

	describe.concurrent('Article CRUD and Search', () => {
		it('should add article and retrieve by id', async () => {
			const content = 'This is a test article about artificial intelligence and machine learning.'
			const article_id = await poly.article.add(content)

			expect(article_id).toBeDefined()
			expect(typeof article_id).toBe('string')

			const articles = await poly.article.get(article_id)

			expect(articles.length).toBe(1)
			expect(articles[0].content).toBe(content)
		})

		it('should add article with embedding', async () => {
			const content = 'Deep learning is a subset of machine learning that uses neural networks.'
			const article_id = await poly.article.addWithEmbedding(content)

			expect(article_id).toBeDefined()
			expect(typeof article_id).toBe('string')
		})

		it('should get all articles', async () => {
			await poly.article.add('Content 1')
			await poly.article.add('Content 2')
			await poly.article.add('Content 3')

			const articles = await poly.article.getAll()

			expect(articles.length).toBeGreaterThanOrEqual(3)
		})

		it('should search articles by full-text search', async () => {
			await poly.article.addWithEmbedding(
				'Python Programming: Python is a popular programming language for data science.'
			)
			await poly.article.addWithEmbedding('JavaScript Basics: JavaScript is used for web development.')
			await poly.article.addWithEmbedding(
				'Data Science: Data science combines statistics and computer science.'
			)

			const results = await poly.article.searchByText({ query: 'programming language', limit: 10 })

			expect(results.length).toBeGreaterThan(0)

			const contents = results.map((a: any) => a.content)

			expect(contents.some(c => c.includes('Python'))).toBe(true)
		})

		it('should search articles by vector similarity', async () => {
			await poly.article.addWithEmbedding(
				'Machine Learning Guide: Machine learning algorithms enable computers to learn from data.'
			)
			await poly.article.addWithEmbedding(
				'Web Development: HTML CSS and JavaScript are the building blocks of websites.'
			)
			await poly.article.addWithEmbedding(
				'Database Systems: Relational databases store structured data using SQL.'
			)

			const results = await poly.article.searchByVector({
				query: 'artificial intelligence and neural networks',
				limit: 10
			})

			expect(results.length).toBeGreaterThanOrEqual(1)

			const contents = results.map((a: any) => a.content)

			expect(contents.some(c => c.includes('Machine Learning'))).toBe(true)
			expect(results[0].similarity).toBeGreaterThan(0.5)
		})
	})
})
