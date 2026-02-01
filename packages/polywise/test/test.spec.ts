import * as fs from 'fs'
import * as path from 'path'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { Brain } from '../src/Brain'
import Polywise from '../src/Polywise'

describe('Polywise Brain System', () => {
	let poly: Polywise
	let brain: Brain
	const dbName = `polywise_test_${Date.now()}_${Math.random().toString(36).slice(2)}`

	beforeAll(async () => {
		poly = new Polywise(dbName)

		await poly.init()

		brain = new Brain(poly, async () => {
			const { nodes, edges } = await poly.getSnapshot()
			const active = nodes.filter((n: any) => n.activation > 0).map((n: any) => n.label)

			if (active.length > 0) {
				console.log(`Active Nodes: [${active.join(', ')}] | Total Edges: ${edges.length}`)
			}
		})
	})

	afterAll(() => {
		brain?.stop()
		poly.off()

		const files = fs.readdirSync('.')
		for (const file of files) {
			if (file.startsWith('polywise_test_') && (file.includes(dbName) || file.includes('polywise'))) {
				const fullPath = path.join('.', file)
				if (fs.statSync(fullPath).isDirectory()) {
					fs.rmSync(fullPath, { recursive: true })
				} else {
					fs.unlinkSync(fullPath)
				}
			}
		}
	})

	describe('Complex Knowledge Graph Operations', () => {
		it('should build complex interconnected knowledge graph', async () => {
			const nodes: number[] = []
			const concepts = [
				{ label: 'Machine Learning', x: 0, y: 0 },
				{ label: 'Neural Networks', x: 100, y: 50 },
				{ label: 'Deep Learning', x: 200, y: 0 },
				{ label: 'Convolution', x: 300, y: 100 },
				{ label: 'Recurrent Networks', x: 100, y: 150 },
				{ label: 'Transformers', x: 250, y: 200 },
				{ label: 'Attention Mechanism', x: 400, y: 150 },
				{ label: 'BERT', x: 500, y: 100 },
				{ label: 'GPT', x: 500, y: 250 },
				{ label: 'Large Language Models', x: 600, y: 175 }
			]

			for (const concept of concepts) {
				const node_id = await poly.addNode({
					label: concept.label,
					x: concept.x,
					y: concept.y,
					threshold: 0.3
				})

				nodes.push(node_id)
			}

			const connections = [
				{ from: 0, to: 1, weight: 0.9 },
				{ from: 1, to: 2, weight: 0.95 },
				{ from: 2, to: 3, weight: 0.7 },
				{ from: 2, to: 4, weight: 0.8 },
				{ from: 2, to: 5, weight: 0.9 },
				{ from: 5, to: 6, weight: 0.95 },
				{ from: 6, to: 7, weight: 0.85 },
				{ from: 6, to: 8, weight: 0.85 },
				{ from: 7, to: 9, weight: 0.9 },
				{ from: 8, to: 9, weight: 0.9 },
				{ from: 4, to: 5, weight: 0.6 },
				{ from: 1, to: 4, weight: 0.7 }
			]

			for (const conn of connections) {
				await poly.connect({
					source_id: nodes[conn.from],
					target_id: nodes[conn.to],
					weight: conn.weight
				})
			}

			await poly.stimulate(nodes[0], 5.0)

			for (let i = 0; i < 100; i++) {
				await poly.tick(0.25)
			}

			const { nodes: snapshot_nodes, edges } = await poly.getSnapshot(0.1)

			expect(snapshot_nodes.length).toBeGreaterThanOrEqual(10)
			expect(edges.length).toBeGreaterThanOrEqual(10)
		})

		it('should process complex scientific article with multiple interconnected triples', async () => {
			const triples = [
				{
					subject: 'Quantum Computing',
					predicate: 'enables',
					object: 'Quantum Supremacy',
					learning_rate: 2.5,
					decay_resistance: 2.0
				},
				{
					subject: 'Quantum Computing',
					predicate: 'uses',
					object: 'Qubits',
					learning_rate: 2.8,
					decay_resistance: 2.5
				},
				{
					subject: 'Qubits',
					predicate: 'exploits',
					object: 'Superposition',
					learning_rate: 2.3,
					decay_resistance: 2.2
				},
				{
					subject: 'Qubits',
					predicate: 'exploits',
					object: 'Entanglement',
					learning_rate: 2.4,
					decay_resistance: 2.2
				},
				{
					subject: 'Superposition',
					predicate: 'allows',
					object: 'Parallel Computation',
					learning_rate: 2.1,
					decay_resistance: 1.9
				},
				{
					subject: 'Entanglement',
					predicate: 'enables',
					object: 'Quantum Teleportation',
					learning_rate: 2.0,
					decay_resistance: 1.8
				},
				{
					subject: 'Quantum Supremacy',
					predicate: 'breaks',
					object: 'Classical Limits',
					learning_rate: 1.9,
					decay_resistance: 1.7
				},
				{
					subject: 'Quantum Teleportation',
					predicate: 'revolutionizes',
					object: 'Secure Communication',
					learning_rate: 2.2,
					decay_resistance: 1.9
				}
			]

			await poly.processArticle({
				title: 'Quantum Computing Fundamentals',
				content: 'Quantum computing represents a paradigm shift in computational capabilities, leveraging quantum mechanical phenomena to process information in fundamentally new ways. This article explores the core concepts...',
				triples
			})

			const { nodes, edges } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(8)
			expect(edges.length).toBeGreaterThanOrEqual(8)

			const node_labels = nodes.map((n: any) => n.label)

			expect(node_labels).toContain('Quantum Computing')
			expect(node_labels).toContain('Qubits')
			expect(node_labels).toContain('Superposition')
		})

		it('should handle large scale knowledge network', async () => {
			const node_ids: number[] = []
			const categories = ['Technology', 'Science', 'Philosophy', 'History', 'Mathematics']
			const concepts: string[] = []

			for (let i = 0; i < 20; i++) {
				const category = categories[i % categories.length]
				const concept = `${category}_Concept_${i}`

				concepts.push(concept)

				const node_id = await poly.addNode({ label: concept, x: i * 10, y: i * 5, threshold: 0.4 })

				node_ids.push(node_id)
			}

			for (let i = 0; i < node_ids.length; i++) {
				for (let j = i + 1; j < Math.min(i + 4, node_ids.length); j++) {
					const weight = 0.3 + (j - i) * 0.1

					await poly.connect({
						source_id: node_ids[i],
						target_id: node_ids[j],
						weight: Math.min(weight, 0.9)
					})
				}
			}

			await poly.stimulate(node_ids[0], 5.0)
			await poly.stimulate(node_ids[5], 4.0)
			await poly.stimulate(node_ids[10], 3.5)

			for (let i = 0; i < 50; i++) {
				await poly.tick(0.25)
			}

			const { nodes, edges } = await poly.getSnapshot(0.1)

			expect(nodes.length).toBeGreaterThanOrEqual(20)
			expect(edges.length).toBeGreaterThanOrEqual(30)
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

			await poly.processArticle({
				title: 'AI Overview',
				content: 'Introduction to AI...',
				triples: article1_triples
			})
			await poly.processArticle({
				title: 'Neural Networks',
				content: 'Understanding neural networks...',
				triples: article2_triples
			})
			await poly.processArticle({
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

	describe('Brain Dynamics and Learning', () => {
		it('should propagate activation through network chains', async () => {
			const chain: number[] = []

			for (let i = 0; i < 8; i++) {
				const node_id = await poly.addNode({
					label: `Chain_Node_${i}`,
					x: i * 50,
					y: 100,
					threshold: 0.3
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

		it('should handle complex learning burst with fatigue', async () => {
			const concepts = [
				{ label: 'Input_Layer', x: 0, y: 200 },
				{ label: 'Hidden_Layer_1', x: 200, y: 100 },
				{ label: 'Hidden_Layer_2', x: 200, y: 300 },
				{ label: 'Hidden_Layer_3', x: 400, y: 200 },
				{ label: 'Output_Layer', x: 600, y: 200 }
			]

			const node_ids: number[] = []

			for (const concept of concepts) {
				const id = await poly.addNode({
					label: concept.label,
					x: concept.x,
					y: concept.y,
					threshold: 0.35
				})

				node_ids.push(id)
			}

			await poly.connect({ source_id: node_ids[0], target_id: node_ids[1], weight: 0.9 })
			await poly.connect({ source_id: node_ids[0], target_id: node_ids[2], weight: 0.9 })
			await poly.connect({ source_id: node_ids[1], target_id: node_ids[3], weight: 0.85 })
			await poly.connect({ source_id: node_ids[2], target_id: node_ids[3], weight: 0.85 })
			await poly.connect({ source_id: node_ids[3], target_id: node_ids[4], weight: 0.9 })

			brain.reportUserActivity()
			brain.addSynapticLoad(800)

			await poly.stimulate(node_ids[0], 5.0)

			await brain.triggerInputBurst(100)

			const { nodes } = await poly.getSnapshot(0.1)
			const output_node = nodes.find((n: any) => n.label === 'Output_Layer')

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

			await poly.processArticle({ title: 'Core Knowledge', content: 'Fundamental concepts...', triples })

			for (let i = 0; i < 10; i++) {
				await poly.tick(0.4)
			}

			const { nodes, edges } = await poly.getSnapshot(0.05)

			expect(nodes.length).toBeGreaterThanOrEqual(7)
			expect(edges.length).toBeGreaterThanOrEqual(6)
		})
	})

	describe('Schema and Data Integrity', () => {
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

		it('should build complete semantic network', async () => {
			const semantic_triples = [
				{
					subject: 'Human',
					predicate: 'has',
					object: 'Brain',
					learning_rate: 2.5,
					decay_resistance: 2.5
				},
				{
					subject: 'Brain',
					predicate: 'contains',
					object: 'Neurons',
					learning_rate: 2.4,
					decay_resistance: 2.3
				},
				{
					subject: 'Neurons',
					predicate: 'form',
					object: 'Synapses',
					learning_rate: 2.3,
					decay_resistance: 2.2
				},
				{
					subject: 'Synapses',
					predicate: 'enable',
					object: 'Learning',
					learning_rate: 2.2,
					decay_resistance: 2.1
				},
				{
					subject: 'Learning',
					predicate: 'requires',
					object: 'Memory',
					learning_rate: 2.1,
					decay_resistance: 2.0
				},
				{
					subject: 'Memory',
					predicate: 'stores',
					object: 'Knowledge',
					learning_rate: 2.0,
					decay_resistance: 1.9
				}
			]

			await poly.processArticle({
				title: 'Cognitive Science',
				content: 'Understanding the mind...',
				triples: semantic_triples
			})

			const { nodes, edges } = await poly.getSnapshot(0.05)

			const path = ['Human', 'Brain', 'Neurons', 'Synapses', 'Learning', 'Memory', 'Knowledge']

			for (const label of path) {
				const node = nodes.find((n: any) => n.label === label)

				expect(node).toBeDefined()
			}

			expect(edges.length).toBeGreaterThanOrEqual(6)
		})
	})

	describe('Node and Edge Filtering with idol_id, root_ids, metrics_ids', () => {
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
			await poly.addNode({ label: 'Knowledge_B', x: 100, y: 0, threshold: 0.5, root_ids: [root_1, root_2] })
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
			const node_1 = await poly.addNode({ label: 'Edge_Test_1', x: 0, y: 0, threshold: 0.5, idol_id: idol })
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
			await poly.connect({ source_id: node_2, target_id: node_3, weight: 0.6, root_ids: ['other_root'] })

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

			await poly.processArticle({
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

	describe('Article CRUD and Search', () => {
		it('should add article and retrieve by id', async () => {
			const title = 'Test Article'
			const content = 'This is a test article about artificial intelligence and machine learning.'
			const article_id = await poly.article.add(title, content)

			expect(article_id).toBeGreaterThan(0)

			const articles = await poly.article.get(article_id)
			expect(articles.length).toBe(1)
			expect(articles[0].title).toBe(title)
			expect(articles[0].content).toBe(content)
		})

		it('should add article with embedding', async () => {
			const title = 'Embedding Test Article'
			const content = 'Deep learning is a subset of machine learning that uses neural networks.'
			const article_id = await poly.article.addWithEmbedding(title, content)

			expect(article_id).toBeGreaterThan(0)
		})

		it('should get all articles', async () => {
			await poly.article.add('Article 1', 'Content 1')
			await poly.article.add('Article 2', 'Content 2')
			await poly.article.add('Article 3', 'Content 3')

			const articles = await poly.article.getAll()

			expect(articles.length).toBeGreaterThanOrEqual(3)
		})

		it('should search articles by full-text search', async () => {
			await poly.article.addWithEmbedding(
				'Python Programming',
				'Python is a popular programming language for data science.'
			)
			await poly.article.addWithEmbedding('JavaScript Basics', 'JavaScript is used for web development.')
			await poly.article.addWithEmbedding(
				'Data Science',
				'Data science combines statistics and computer science.'
			)

			const results = await poly.article.searchByText('programming language', 10)

			expect(results.length).toBeGreaterThan(0)
			const titles = results.map((a: any) => a.title)
			expect(titles).toContain('Python Programming')
		})

		it('should search articles by vector similarity', async () => {
			await poly.article.addWithEmbedding(
				'Machine Learning Guide',
				'Machine learning algorithms enable computers to learn from data.'
			)
			await poly.article.addWithEmbedding(
				'Web Development',
				'HTML CSS and JavaScript are the building blocks of websites.'
			)
			await poly.article.addWithEmbedding(
				'Database Systems',
				'Relational databases store structured data using SQL.'
			)

			const results = await poly.article.searchByVector('artificial intelligence and neural networks', 10)

			expect(results.length).toBeGreaterThanOrEqual(1)
			const titles = results.map((a: any) => a.title)
			expect(titles).toContain('Machine Learning Guide')
			expect(results[0].similarity).toBeGreaterThan(0.5)
		})
	})
})
