import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'

describe('Article CRUD Operations', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_article_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should create article with title and content', async () => {
		const article = await poly.article.process({
			title: 'Test Article',
			content: 'This is test content for the article.'
		})

		expect(article.id).toBeGreaterThan(0)
		expect(article.title).toBe('Test Article')
		expect(article.content).toBe('This is test content for the article.')
		expect(article.created_at).toBeInstanceOf(Date)
	})

	it('should get article by ID', async () => {
		await poly.article.process({
			title: 'Article to Retrieve',
			content: 'Content for retrieval test.'
		})

		const articles = await poly.article.searchFts({
			query: 'Retrieve',
			limit: 1
		})

		expect(articles.length).toBe(1)

		const article = await poly.article.get(articles[0].id)

		expect(article.length).toBeGreaterThan(0)
		expect(article[0]?.title).toBe('Article to Retrieve')
	})

	it('should update article', async () => {
		const created = await poly.article.process({
			title: 'Article to Update',
			content: 'Original content.'
		})

		const updated = await poly.article.update({
			id: created.id,
			title: 'Updated Title',
			content: 'Updated content.'
		})

		expect(updated.title).toBe('Updated Title')
		expect(updated.content).toBe('Updated content.')

		const fetched = await poly.article.get(created.id)

		expect(fetched[0]?.title).toBe('Updated Title')
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
		const poly2 = new Polywise()

		await poly2.init({
			data_dir: `:polywise_empty_test_${unique_id}:`
		})

		const results = await poly2.article.searchFts({
			query: 'test',
			limit: 10
		})

		expect(results).toEqual([])

		await poly2.off()
	})
})

describe('Full-Text Search and Vector Search', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_search_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	describe('Full-Text Search', () => {
		it('should find articles matching exact keywords', async () => {
			await poly.article.process({
				title: 'Getting Started with TypeScript',
				content: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.'
			})

			await poly.article.process({
				title: 'Advanced TypeScript Patterns',
				content: 'This article covers advanced TypeScript patterns and best practices.'
			})

			const results = await poly.article.searchFts({
				query: 'TypeScript',
				limit: 10
			})

			expect(results.length).toBeGreaterThanOrEqual(2)
			expect(results.every(r => r.title?.includes('TypeScript'))).toBe(true)
		})

		it('should search in both title and content', async () => {
			await poly.article.process({
				title: 'Database Systems',
				content: 'PostgreSQL is a powerful open-source relational database management system.'
			})

			await poly.article.process({
				title: 'Web Development',
				content: 'JavaScript frameworks like React and Vue are popular for web development.'
			})

			const title_results = await poly.article.searchFts({
				query: 'Database',
				limit: 10
			})

			expect(title_results.length).toBeGreaterThanOrEqual(1)
			expect(title_results[0].title).toBe('Database Systems')
		})

		it('should return empty array for non-matching query', async () => {
			await poly.article.process({
				title: 'Random Article',
				content: 'This has nothing to do with the search query.'
			})

			const results = await poly.article.searchFts({
				query: 'XYZ123NonExistent',
				limit: 10
			})

			expect(results).toEqual([])
		})

		it('should respect the limit parameter', async () => {
			for (let i = 0; i < 5; i++) {
				await poly.article.process({
					title: `Article ${i}`,
					content: `Content ${i}`
				})
			}

			const results = await poly.article.searchFts({
				query: 'Article',
				limit: 3
			})

			expect(results.length).toBe(3)
		})

		it('should handle case-insensitive search', async () => {
			await poly.article.process({
				title: 'lowercase search test',
				content: 'This has LOWERCASE in content'
			})

			const results = await poly.article.searchFts({
				query: 'LOWERCASE',
				limit: 10
			})

			expect(results.length).toBe(1)
		})

		it('should search partial word matches', async () => {
			await poly.article.process({
				title: 'JavaScript Programming',
				content: 'I love programming in JavaScript.'
			})

			const results = await poly.article.searchFts({
				query: 'program',
				limit: 10
			})

			expect(results.length).toBeGreaterThanOrEqual(1)
		})
	})
})
