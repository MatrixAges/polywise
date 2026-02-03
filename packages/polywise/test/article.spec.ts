import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'

describe.concurrent('Article CRUD Operations', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_article_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_concurrency: 10,
			reranker_concurrency: 10
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should create article using real-world software documentation', async () => {
		const content = software_architecture_datasets[0]
		const article = await poly.article.process(content)

		expect(article.id).toBeGreaterThan(0)
		expect(article.content).toBe(content)
		expect(article.created_at).toBeDefined()
	})

	it('should get article by searching for its real content', async () => {
		const content = cognitive_science_datasets[0]
		await poly.article.process(content)

		const articles = await poly.article.searchFts('Understanding brain architecture', 1)

		expect(articles.length).toBe(1)

		const article = await poly.article.get(articles[0].id)

		expect(article.length).toBeGreaterThan(0)
		expect(article[0]?.content).toBe(content)
	})

	it('should update real-world article content', async () => {
		const created = await poly.article.process(software_architecture_datasets[1])

		const updated = await poly.article.update(created.id, 'Updated content for containerization...')

		expect(updated.content).toBe('Updated content for containerization...')

		const fetched = await poly.article.get(created.id)

		expect(fetched[0]?.content).toBe('Updated content for containerization...')
	})

	it('should delete article', async () => {
		const created = await poly.article.process('Content for deletion test.')

		await poly.article.delete(created.id)

		const fetched = await poly.article.get(created.id)

		expect(fetched).toBeNull()
	})

	it('should get all articles', async () => {
		await poly.article.process('Content 1')

		await poly.article.process('Content 2')

		const articles = await poly.article.getAll()

		expect(articles.length).toBeGreaterThanOrEqual(2)
	})

	it('should search articles with empty database', async () => {
		const empty_poly = new Polywise()
		await empty_poly.init({
			data_dir: ':polywise_article_test_empty:',
			embedding_concurrency: 10,
			reranker_concurrency: 10
		})

		const results = await empty_poly.article.searchFts('test', 10)

		expect(results).toEqual([])

		await empty_poly.off()
	})
})

describe.concurrent('Full-Text Search and Vector Search', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_search_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_concurrency: 10,
			reranker_concurrency: 10
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	describe.concurrent('Full-Text Search', () => {
		it('should find real-world articles matching specific technical keywords', async () => {
			for (const content of software_architecture_datasets) {
				await poly.article.process(content)
			}

			const results = await poly.article.searchByText('Microservices architecture', 10)

			expect(results.length).toBeGreaterThanOrEqual(1)
			expect(results.some(r => r.content.includes('Microservices'))).toBe(true)
		})

		it('should search for cognitive science concepts in content', async () => {
			for (const content of cognitive_science_datasets) {
				await poly.article.process(content)
			}

			const results = await poly.article.searchFts('billion neurons', 10)

			expect(results.length).toBeGreaterThanOrEqual(1)
			expect(results[0].content).toContain('neurons')
		})

		it('should return empty array for non-existent technical terms', async () => {
			const results = await poly.article.searchFts('NonExistentQuantumServiceMesh', 10)

			expect(results).toEqual([])
		})
	})
})
