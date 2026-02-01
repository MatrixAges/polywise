import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { Brain } from '../src/Brain'
import { Polywise } from '../src/Polywise'

describe('Polywise Brain System', () => {
	let poly: Polywise
	let brain: Brain

	beforeAll(async () => {
		poly = new Polywise(':polywise:')

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
				const node_id = await poly.addNode(concept.label, concept.x, concept.y, 0.3)

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
				await poly.connect(nodes[conn.from], nodes[conn.to], conn.weight)
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

			await poly.processArticle(
				'Quantum Computing Fundamentals',
				'Quantum computing represents a paradigm shift in computational capabilities, leveraging quantum mechanical phenomena to process information in fundamentally new ways. This article explores the core concepts...',
				triples
			)

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

				const node_id = await poly.addNode(concept, i * 10, i * 5, 0.4)

				node_ids.push(node_id)
			}

			for (let i = 0; i < node_ids.length; i++) {
				for (let j = i + 1; j < Math.min(i + 4, node_ids.length); j++) {
					const weight = 0.3 + (j - i) * 0.1

					await poly.connect(node_ids[i], node_ids[j], Math.min(weight, 0.9))
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

			await poly.processArticle('AI Overview', 'Introduction to AI...', article1_triples)
			await poly.processArticle('Neural Networks', 'Understanding neural networks...', article2_triples)
			await poly.processArticle('Deep Learning', 'Deep learning concepts...', article3_triples)

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
				const node_id = await poly.addNode(`Chain_Node_${i}`, i * 50, 100, 0.3)

				chain.push(node_id)
			}

			for (let i = 0; i < chain.length - 1; i++) {
				await poly.connect(chain[i], chain[i + 1], 0.85)
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
				const id = await poly.addNode(concept.label, concept.x, concept.y, 0.35)

				node_ids.push(id)
			}

			await poly.connect(node_ids[0], node_ids[1], 0.9)
			await poly.connect(node_ids[0], node_ids[2], 0.9)
			await poly.connect(node_ids[1], node_ids[3], 0.85)
			await poly.connect(node_ids[2], node_ids[3], 0.85)
			await poly.connect(node_ids[3], node_ids[4], 0.9)

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

			await poly.processArticle('Core Knowledge', 'Fundamental concepts...', triples)

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
				promises.push(poly.addNode(`Concurrent_${i}`, i * 20, i * 10, 0.5))
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

			await poly.processArticle('Cognitive Science', 'Understanding the mind...', semantic_triples)

			const { nodes, edges } = await poly.getSnapshot(0.05)

			const path = ['Human', 'Brain', 'Neurons', 'Synapses', 'Learning', 'Memory', 'Knowledge']

			for (const label of path) {
				const node = nodes.find((n: any) => n.label === label)

				expect(node).toBeDefined()
			}

			expect(edges.length).toBeGreaterThanOrEqual(6)
		})
	})
})
