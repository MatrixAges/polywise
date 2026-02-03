import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitive_articles, cognitive_science_triples } from './datasets/cognitive'
import { software_architecture_triples } from './datasets/software'

describe.concurrent('Polywise Brain System', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir: db_name,
			embedding_concurrency: 10,
			reranker_concurrency: 10,
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
		it('should build complex interconnected knowledge graph using software architecture data', async () => {
			const nodes: number[] = []

			// Extract unique labels from triples
			const labels = Array.from(
				new Set([
					...software_architecture_triples.map(t => t.subject),
					...software_architecture_triples.map(t => t.object)
				])
			)

			const node_map = new Map<string, number>()

			for (const label of labels) {
				const node_id = await poly.addNode({
					label: `${label}_${unique_id}`,
					x: Math.random() * 800,
					y: Math.random() * 600,
					threshold: 0.3,
					embedding: await poly.pipeline.embed(label)
				})

				node_map.set(label, node_id)
				nodes.push(node_id)
			}

			for (const t of software_architecture_triples) {
				await poly.connect({
					source_id: node_map.get(t.subject)!,
					target_id: node_map.get(t.object)!,
					weight: 0.8
				})
			}

			const start_node = node_map.get('Microservices')!
			await poly.stimulate(start_node, 5.0)

			for (let i = 0; i < 50; i++) {
				await poly.tick(0.25)
			}

			const { nodes: snapshot_nodes, edges } = await poly.getSnapshot(0.1)

			expect(snapshot_nodes.length).toBeGreaterThanOrEqual(10)
			expect(edges.length).toBeGreaterThanOrEqual(software_architecture_triples.length)
		})

		it('should process complex scientific article with real-world knowledge', async () => {
			const article = cognitive_articles[0]

			await poly.save({
				title: article.title,
				content: article.content,
				triples: cognitive_science_triples.slice(0, 8)
			})

			const { nodes, edges } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(8)
			expect(edges.length).toBeGreaterThanOrEqual(8)

			const node_labels = nodes.map((n: any) => n.label)

			expect(node_labels.some(l => l.includes('Human Brain'))).toBe(true)
			expect(node_labels.some(l => l.includes('Neurons'))).toBe(true)
		})

		it('should handle large scale knowledge network with real entities', async () => {
			const node_ids: number[] = []
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
				const node_id = await poly.addNode({
					label: `${entities[i]}_${i}`,
					x: i * 10,
					y: i * 5,
					threshold: 0.4,
					embedding: await poly.pipeline.embed(entities[i])
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

			for (let i = 0; i < 50; i++) {
				await poly.tick(0.25)
			}

			const { nodes, edges } = await poly.getSnapshot(0.1)

			expect(nodes.length).toBeGreaterThanOrEqual(20)
		})

		it('should process multiple articles with overlapping concepts', async () => {
			const article1_triples = [
				{
					subject: 'Artificial Intelligence',
					predicate: 'includes',
					object: 'Machine Learning',
					learning_rate: 2.5,
					decay_resistance: 2.0
				},
				{
					subject: 'Machine Learning',
					predicate: 'includes',
					object: 'Supervised Learning',
					learning_rate: 2.0,
					decay_resistance: 1.8
				},
				{
					subject: 'Machine Learning',
					predicate: 'includes',
					object: 'Unsupervised Learning',
					learning_rate: 2.0,
					decay_resistance: 1.8
				}
			]

			const article2_triples = [
				{
					subject: 'Machine Learning',
					predicate: 'uses',
					object: 'Neural Networks',
					learning_rate: 2.3,
					decay_resistance: 1.9
				},
				{
					subject: 'Neural Networks',
					predicate: 'inspired_by',
					object: 'Biological Brain',
					learning_rate: 2.1,
					decay_resistance: 1.7
				},
				{
					subject: 'Biological Brain',
					predicate: 'has',
					object: 'Neurons',
					learning_rate: 1.8,
					decay_resistance: 1.5
				}
			]

			const article3_triples = [
				{
					subject: 'Deep Learning',
					predicate: 'is_a',
					object: 'Machine Learning',
					learning_rate: 2.4,
					decay_resistance: 2.0
				},
				{
					subject: 'Deep Learning',
					predicate: 'uses',
					object: 'Multiple Layers',
					learning_rate: 2.2,
					decay_resistance: 1.9
				}
			]

			await poly.save({
				title: 'AI Overview',
				content: 'Introduction to AI...',
				triples: article1_triples
			})

			await poly.save({
				title: 'Neural Networks',
				content: 'Understanding neural networks...',
				triples: article2_triples
			})

			await poly.save({
				title: 'Deep Learning',
				content: 'Deep learning concepts...',
				triples: article3_triples
			})

			const { nodes, edges } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(8)
			expect(edges.length).toBeGreaterThanOrEqual(8)

			const ml_node = nodes.find((n: any) => n.label === 'Machine Learning')

			expect(ml_node).toBeDefined()
			expect(ml_node?.potential).toBeGreaterThan(0)
		})
	})

	describe.concurrent('Brain Dynamics and Learning', () => {
		it('should propagate activation through network chains using real entities', async () => {
			const chain: number[] = []
			const entities = ['Processor', 'Instruction', 'Memory', 'Address', 'Bus', 'Cache', 'RAM', 'Storage']

			for (let i = 0; i < entities.length; i++) {
				const node_id = await poly.addNode({
					label: `${entities[i]}_${unique_id}`,
					x: i * 50,
					y: 100,
					threshold: 0.3,
					embedding: await poly.pipeline.embed(entities[i])
				})

				chain.push(node_id)
			}

			for (let i = 0; i < chain.length - 1; i++) {
				await poly.connect({ source_id: chain[i], target_id: chain[i + 1], weight: 0.85 })
			}

			await poly.stimulate(chain[0], 5.0)

			for (let i = 0; i < 80; i++) {
				await poly.tick(0.25)
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

			const node_ids: number[] = []

			for (const concept of concepts) {
				const id = await poly.addNode({
					label: `${concept.label}_${unique_id}`,
					x: concept.x,
					y: concept.y,
					threshold: 0.35,
					embedding: await poly.pipeline.embed(concept.label)
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

			await poly.brain.triggerInputBurst(100)

			const { nodes } = await poly.getSnapshot(0.1)
			const output_node = nodes.find((n: any) => n.label.includes('Secure_API'))

			expect(output_node).toBeDefined()
		})

		it('should maintain and strengthen important connections', async () => {
			const triples = [
				{
					subject: 'Core_Concept',
					predicate: 'fundamental_to',
					object: 'Derived_1',
					learning_rate: 2.9,
					decay_resistance: 2.8
				},
				{
					subject: 'Core_Concept',
					predicate: 'fundamental_to',
					object: 'Derived_2',
					learning_rate: 2.9,
					decay_resistance: 2.8
				},
				{
					subject: 'Core_Concept',
					predicate: 'fundamental_to',
					object: 'Derived_3',
					learning_rate: 2.9,
					decay_resistance: 2.8
				},
				{
					subject: 'Derived_1',
					predicate: 'leads_to',
					object: 'Application_1',
					learning_rate: 1.5,
					decay_resistance: 1.2
				},
				{
					subject: 'Derived_2',
					predicate: 'leads_to',
					object: 'Application_2',
					learning_rate: 1.5,
					decay_resistance: 1.2
				},
				{
					subject: 'Derived_3',
					predicate: 'leads_to',
					object: 'Application_3',
					learning_rate: 1.5,
					decay_resistance: 1.2
				}
			]

			await poly.save({ title: 'Core Knowledge', content: 'Fundamental concepts...', triples })

			for (let i = 0; i < 10; i++) {
				await poly.tick(0.4)
			}

			const { nodes, edges } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(7)
			expect(edges.length).toBeGreaterThanOrEqual(6)
		})
	})

	describe.concurrent('Schema and Data Integrity', () => {
		it('should handle concurrent node operations', async () => {
			const promises: Promise<number>[] = []

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

		it('should build complete semantic network using cognitive science data', async () => {
			const path = [
				'Human Brain',
				'Neurons',
				'Neural Networks',
				'Deep Learning',
				'Backpropagation',
				'Weights'
			]

			for (const t of cognitive_science_triples.slice(0, 6)) {
				await poly.save({
					title: `Memory of ${t.subject}`,
					content: `${t.subject} ${t.predicate} ${t.object}`,
					triples: [t]
				})
			}

			const { nodes, edges } = await poly.getSnapshot(0.05)

			for (const label of path) {
				const node = nodes.find((n: any) => n.label === label)
				expect(node).toBeDefined()
			}

			expect(edges.length).toBeGreaterThanOrEqual(5)
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

			const triples = [
				{
					subject: 'AI_Technology',
					predicate: 'uses',
					object: 'Machine_Learning',
					learning_rate: 2.0,
					decay_resistance: 1.5
				},
				{
					subject: 'Machine_Learning',
					predicate: 'includes',
					object: 'Deep_Learning',
					learning_rate: 2.2,
					decay_resistance: 1.8
				}
			]

			await poly.save({
				title: 'AI Article',
				content: 'Content about AI...',
				triples,
				idol_id: idol,
				root_ids,
				metrics_ids
			})

			const nodes = await poly.getNodesByIdol(idol)
			const edges = await poly.getEdgesByIdol(idol)

			expect(nodes.length).toBeGreaterThanOrEqual(3)
			expect(edges.length).toBeGreaterThanOrEqual(2)

			const ai_node = nodes.find((n: any) => n.label === 'AI_Technology')

			expect(ai_node).toBeDefined()
			expect(ai_node.idol_id).toBe(idol)
			expect(ai_node.root_ids).toContain('article_root_1')
			expect(ai_node.metrics_ids).toContain('metric_quality')
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

			const { nodes, edges } = await poly.getSnapshot(0.1)

			const snapshot_node = nodes.find((n: any) => n.label === 'Snapshot_Node')

			expect(snapshot_node).toBeDefined()
			expect(snapshot_node.idol_id).toBe(idol)
			expect(snapshot_node.root_ids).toEqual(root_ids)
			expect(snapshot_node.metrics_ids).toEqual(metrics_ids)
		})
	})

	describe.concurrent('Article CRUD and Search', () => {
		it('should add article and retrieve by id', async () => {
			const title = 'Test Article'
			const content = 'This is a test article about artificial intelligence and machine learning.'
			const article_id = await poly.article.add({ title, content })

			expect(article_id).toBeGreaterThan(0)

			const articles = await poly.article.get(article_id)

			expect(articles.length).toBe(1)
			expect(articles[0].title).toBe(title)
			expect(articles[0].content).toBe(content)
		})

		it('should add article with embedding', async () => {
			const title = 'Embedding Test Article'
			const content = 'Deep learning is a subset of machine learning that uses neural networks.'
			const article_id = await poly.article.addWithEmbedding({ title, content })

			expect(article_id).toBeGreaterThan(0)
		})

		it('should get all articles', async () => {
			await poly.article.add({ title: 'Article 1', content: 'Content 1' })
			await poly.article.add({ title: 'Article 2', content: 'Content 2' })
			await poly.article.add({ title: 'Article 3', content: 'Content 3' })

			const articles = await poly.article.getAll()

			expect(articles.length).toBeGreaterThanOrEqual(3)
		})

		it('should search articles by full-text search', async () => {
			await poly.article.addWithEmbedding({
				title: 'Python Programming',
				content: 'Python is a popular programming language for data science.'
			})
			await poly.article.addWithEmbedding({
				title: 'JavaScript Basics',
				content: 'JavaScript is used for web development.'
			})
			await poly.article.addWithEmbedding({
				title: 'Data Science',
				content: 'Data science combines statistics and computer science.'
			})

			const results = await poly.article.searchByText({ query: 'programming language', limit: 10 })

			expect(results.length).toBeGreaterThan(0)

			const titles = results.map((a: any) => a.title)

			expect(titles).toContain('Python Programming')
		})

		it('should search articles by vector similarity', async () => {
			await poly.article.addWithEmbedding({
				title: 'Machine Learning Guide',
				content: 'Machine learning algorithms enable computers to learn from data.'
			})
			await poly.article.addWithEmbedding({
				title: 'Web Development',
				content: 'HTML CSS and JavaScript are the building blocks of websites.'
			})
			await poly.article.addWithEmbedding({
				title: 'Database Systems',
				content: 'Relational databases store structured data using SQL.'
			})

			const results = await poly.article.searchByVector({
				query: 'artificial intelligence and neural networks',
				limit: 10
			})

			expect(results.length).toBeGreaterThanOrEqual(1)

			const titles = results.map((a: any) => a.title)

			expect(titles).toContain('Machine Learning Guide')
			expect(results[0].similarity).toBeGreaterThan(0.5)
		})
	})
})
