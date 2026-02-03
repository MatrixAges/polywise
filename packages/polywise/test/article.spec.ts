import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitive_articles } from './datasets/cognitive'
import { software_articles } from './datasets/software'

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
		const article_data = software_articles[0]
		const article = await poly.article.process(article_data)

		expect(article.id).toBeGreaterThan(0)
		expect(article.title).toBe(article_data.title)
		expect(article.content).toBe(article_data.content)
		expect(article.created_at).toBeInstanceOf(Date)
	})

	it('should get article by searching for its real title', async () => {
		const article_data = cognitive_articles[0]
		await poly.article.process(article_data)

		const articles = await poly.article.searchFts({
			query: 'Cognitive functions architecture',
			limit: 1
		})

		expect(articles.length).toBe(1)

		const article = await poly.article.get(articles[0].id)

		expect(article.length).toBeGreaterThan(0)
		expect(article[0]?.title).toBe(article_data.title)
	})

	it('should update real-world article content', async () => {
		const created = await poly.article.process(software_articles[1])

		const updated = await poly.article.update({
			id: created.id,
			title: 'Docker Best Practices (Updated)',
			content: 'Updated content for containerization...'
		})

		expect(updated.title).toBe('Docker Best Practices (Updated)')
		expect(updated.content).toBe('Updated content for containerization...')

		const fetched = await poly.article.get(created.id)

		expect(fetched[0]?.title).toBe('Docker Best Practices (Updated)')
	})

	it('should delete article', async () => {
		const created = await poly.article.process({
			title: 'Article to Delete',
			content: 'Content for deletion test.'
		})

		await poly.article.delete(created.id)

		const fetched = await poly.article.get(created.id)

		expect(fetched).toBeNull()
	})

	it('should get all articles', async () => {
		await poly.article.process({
			title: 'Article 1',
			content: 'Content 1'
		})

		await poly.article.process({
			title: 'Article 2',
			content: 'Content 2'
		})

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

		const results = await empty_poly.article.searchFts({
			query: 'test',
			limit: 10
		})

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
			for (const article of software_articles.slice(0, 3)) {
				await poly.article.process(article)
			}

			const results = await poly.article.searchFts({
				query: 'Microservices scalability',
				limit: 10
			})

			expect(results.length).toBeGreaterThanOrEqual(1)
			expect(results.some(r => r.title.includes('Microservices'))).toBe(true)
		})

		it('should search for cognitive science concepts in title and content', async () => {
			for (const article of cognitive_articles) {
				await poly.article.process(article)
			}

			const results = await poly.article.searchFts({
				query: '86 billion neurons communication synapses',
				limit: 10
			})

			expect(results.length).toBeGreaterThanOrEqual(1)
			expect(results[0].title).toBe('How the Human Brain Works')
		})

		it('should return empty array for non-existent technical terms', async () => {
			const results = await poly.article.searchFts({
				query: 'NonExistentQuantumServiceMesh',
				limit: 10
			})

			expect(results).toEqual([])
		})
	})
})
