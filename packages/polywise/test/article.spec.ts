import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'
import { getTestKeywords, getTestRerank, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Article CRUD Operations', () => {
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
			keyword_config: {
				type: 'custom',
				fn: getTestKeywords
			}
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should create article using real-world software documentation', async () => {
		const content = software_architecture_datasets[0]
		const article = await poly.article.process({ content })

		expect(article.id).toBeDefined()
		expect(typeof article.id).toBe('string')
		expect(article.content).toBe(content)
		expect(article.created_at).toBeDefined()
	})

	it('should get article by searching for its real content', async () => {
		const content = cognitive_science_datasets[0]
		await poly.article.process({ content })

		const articles = await poly.article.searchByText({ query: 'Understanding brain architecture', limit: 1 })

		expect(articles.length).toBe(1)

		const article = await poly.article.get(articles[0].id)

		expect(article.length).toBeGreaterThan(0)
		expect(article[0]?.content).toBe(content)
	})

	it('should update real-world article content', async () => {
		const created = await poly.article.process({ content: software_architecture_datasets[1] })

		const updated = await poly.article.update(created.id, {
			content: 'Updated content for containerization...'
		})

		expect(updated.content).toBe('Updated content for containerization...')

		const fetched = await poly.article.get(created.id)

		expect(fetched[0]?.content).toBe('Updated content for containerization...')
	})

	it('should delete article', async () => {
		const created = await poly.article.process({ content: 'Content for deletion test.' })

		await poly.article.delete(created.id)

		const fetched = await poly.article.get(created.id)

		expect(fetched).toBeNull()
	})

	it('should save article and return memory_id via poly.save()', async () => {
		const content = software_architecture_datasets[0]
		const memory_id = await poly.save({ content })

		expect(memory_id).toBeDefined()
		expect(typeof memory_id).toBe('string')

		const article = await poly.article.get(memory_id)

		expect(article).not.toBeNull()
		expect(article[0]?.content).toBe(content)
	})

	it('should update memory via poly.update() and sync embedding', async () => {
		const originalContent = 'Original content about machine learning algorithms'
		const memory_id = await poly.save({ content: originalContent })

		expect(memory_id).toBeDefined()
		expect(typeof memory_id).toBe('string')

		const newContent = 'Updated content about deep learning and neural networks'
		await poly.update({ memory_id, content: newContent })

		const article = await poly.article.get(memory_id)
		expect(article[0]?.content).toBe(newContent)

		const queryResult = await poly.query({ query: 'deep learning neural networks' })
		const updatedContentInMemory = queryResult.memory.some(m => m.text.includes('deep learning'))
		expect(updatedContentInMemory).toBe(true)
	})

	it('should forget memory via poly.forget() and remove all related data', async () => {
		const content = 'Memory to be forgotten about neural networks and cognitive architecture'
		const memory_id = await poly.save({ content })

		expect(memory_id).toBeDefined()
		expect(typeof memory_id).toBe('string')

		await poly.forget({ memory_id })

		const article = await poly.article.get(memory_id)
		expect(article).toBeNull()

		const queryResult = await poly.query({ query: 'neural networks cognitive' })
		const contentInMemory = queryResult.memory.some(m => m.text.includes('Memory to be forgotten'))
		expect(contentInMemory).toBe(false)
	})

	it('should get all articles', async () => {
		await poly.article.process({ content: 'Content 1' })

		await poly.article.process({ content: 'Content 2' })

		const articles = await poly.article.getAll()

		expect(articles.length).toBeGreaterThanOrEqual(2)
	})

	it('should search articles with empty database', async () => {
		const empty_poly = new Polywise()

		await empty_poly.init({
			data_dir: getDataDir()
		})

		const results = await empty_poly.article.searchByText({ query: 'test', limit: 10 })

		expect(results).toEqual([])

		await empty_poly.off()
	})
})

describe.concurrent('Full-Text Search and Vector Search', () => {
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
			keyword_config: {
				type: 'custom',
				fn: getTestKeywords
			}
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	describe.concurrent('Full-Text Search', () => {
		it('should find real-world articles matching specific technical keywords', async () => {
			for (const content of software_architecture_datasets) {
				await poly.article.process({ content })
			}

			const results = await poly.article.searchByText({ query: 'Microservices architecture', limit: 10 })

			expect(results.length).toBeGreaterThanOrEqual(1)
			expect(results.some(r => r.content.includes('Microservices'))).toBe(true)
		})

		it('should search for cognitive science concepts in content', async () => {
			for (const content of cognitive_science_datasets) {
				await poly.article.process({ content })
			}

			const results = await poly.article.searchByText({ query: 'billion neurons', limit: 10 })

			expect(results.length).toBeGreaterThanOrEqual(1)
			expect(results[0].content).toContain('neurons')
		})

		it('should return empty array for non-existent technical terms', async () => {
			const results = await poly.article.searchByText({ query: 'NonExistentQuantumServiceMesh', limit: 10 })

			expect(results).toEqual([])
		})
	})
})
