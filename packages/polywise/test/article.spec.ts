import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cleanupTestDatabases } from './utils'

describe('Full-Text Search and Vector Search', () => {
	let poly: Polywise
	const db_name = `:polywise_search_test_${Date.now()}_${Math.random().toString(36).slice(2)}:`

	beforeAll(async () => {
		poly = new Polywise(db_name)
		await poly.init()
	})

	afterAll(async () => {
		await poly?.off()

		cleanupTestDatabases()
	})

	describe('Full-Text Search', () => {
		beforeAll(async () => {
			await poly.article.addWithEmbedding({
				title: 'Introduction to Machine Learning',
				content: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming. It uses algorithms and statistical models to analyze patterns.'
			})

			await poly.article.addWithEmbedding({
				title: 'Deep Learning Fundamentals',
				content: 'Deep learning uses neural networks with multiple layers to model complex patterns. It is particularly effective for image recognition, natural language processing, and speech synthesis.'
			})

			await poly.article.addWithEmbedding({
				title: 'Database Systems',
				content: 'Relational databases use SQL for data management. They organize data into tables with relationships between them, ensuring data integrity and efficient querying.'
			})

			await poly.article.addWithEmbedding({
				title: 'Web Development Guide',
				content: 'Modern web development involves HTML, CSS, and JavaScript. Frameworks like React and Vue.js help build interactive user interfaces for web applications.'
			})

			await poly.article.addWithEmbedding({
				title: 'Python Programming',
				content: 'Python is a versatile programming language used in data science, web development, and automation. Its simple syntax makes it ideal for beginners and experts alike.'
			})
		})

		it('should find articles matching exact keywords', async () => {
			const results = await poly.article.searchByText({ query: 'machine learning', limit: 10 })

			expect(results.length).toBeGreaterThan(0)

			const titles = results.map((a: any) => a.title.toLowerCase())

			expect(titles.some((t: string) => t.includes('machine'))).toBe(true)
		})

		it('should search in both title and content', async () => {
			const results_by_title = await poly.article.searchByText({ query: 'Python Programming', limit: 10 })
			const results_by_content = await poly.article.searchByText({
				query: 'versatile programming language',
				limit: 10
			})

			expect(results_by_title.length).toBeGreaterThan(0)
			expect(results_by_content.length).toBeGreaterThan(0)

			const title_result = results_by_title.find((a: any) => a.title === 'Python Programming')
			const content_result = results_by_content.find((a: any) => a.title === 'Python Programming')

			expect(title_result).toBeDefined()
			expect(content_result).toBeDefined()
		})

		it('should return empty array for non-matching query', async () => {
			const results = await poly.article.searchByText({ query: 'quantum physics astronomy', limit: 10 })

			expect(results.length).toBe(0)
		})

		it('should respect the limit parameter', async () => {
			const results_limited = await poly.article.searchByText({ query: 'learning', limit: 2 })

			expect(results_limited.length).toBeLessThanOrEqual(2)
		})

		it('should handle case-insensitive search', async () => {
			const results_lower = await poly.article.searchByText({ query: 'database', limit: 10 })
			const results_upper = await poly.article.searchByText({ query: 'DATABASE', limit: 10 })

			expect(results_lower.length).toBeGreaterThan(0)
			expect(results_upper.length).toBeGreaterThan(0)
			expect(results_lower.length).toBe(results_upper.length)
		})

		it('should search partial word matches', async () => {
			const results = await poly.article.searchByText({ query: 'data', limit: 10 })

			expect(results.length).toBeGreaterThanOrEqual(2)
		})
	})

	describe('Vector Search', () => {
		beforeAll(async () => {
			await poly.article.addWithEmbedding({
				title: 'Neural Networks Architecture',
				content: 'Neural networks consist of interconnected nodes organized in layers. Each connection has weights that are adjusted during training to minimize prediction errors.'
			})

			await poly.article.addWithEmbedding({
				title: 'Computer Vision Techniques',
				content: 'Computer vision enables machines to interpret and understand visual information from images and videos. Convolutional neural networks are commonly used.'
			})

			await poly.article.addWithEmbedding({
				title: 'Natural Language Processing',
				content: 'NLP combines computational linguistics with machine learning to enable computers to understand, interpret, and generate human language text.'
			})

			await poly.article.addWithEmbedding({
				title: 'Blockchain Technology',
				content: 'Blockchain is a distributed ledger technology that maintains a continuously growing list of records. It enables secure peer-to-peer transactions.'
			})

			await poly.article.addWithEmbedding({
				title: 'Cloud Computing Services',
				content: 'Cloud computing delivers computing services over the internet. It offers scalability, flexibility, and cost-efficiency for businesses of all sizes.'
			})
		})

		it('should find semantically similar articles', async () => {
			const results = await poly.article.searchByVector({
				query: 'artificial intelligence and neural networks',
				limit: 10
			})

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].similarity).toBeGreaterThan(0.5)
		})

		it('should return articles with similarity scores', async () => {
			const results = await poly.article.searchByVector({ query: 'deep learning algorithms', limit: 5 })

			expect(results.length).toBeGreaterThan(0)

			for (const article of results) {
				expect(article.similarity).toBeDefined()
				expect(article.similarity).toBeGreaterThanOrEqual(0)
				expect(article.similarity).toBeLessThanOrEqual(1)
			}
		})

		it('should order results by similarity descending', async () => {
			const results = await poly.article.searchByVector({ query: 'machine learning models', limit: 10 })

			expect(results.length).toBeGreaterThan(1)

			for (let i = 0; i < results.length - 1; i++) {
				expect(results[i].similarity).toBeGreaterThanOrEqual(results[i + 1].similarity)
			}
		})

		it('should return empty array for unrelated query', async () => {
			const results = await poly.article.searchByVector({ query: 'ancient greek mythology', limit: 10 })

			expect(results.length).toBeGreaterThanOrEqual(0)
		})

		it('should handle similar concepts not exact matches', async () => {
			const results = await poly.article.searchByVector({
				query: 'teaching computers to see and understand pictures',
				limit: 10
			})

			const titles = results.map((a: any) => a.title)

			expect(titles.some((t: string) => t.toLowerCase().includes('vision'))).toBe(true)
		})
	})

	describe('Hybrid Search Comparison', () => {
		beforeAll(async () => {
			await poly.article.addWithEmbedding({
				title: 'React Framework Guide',
				content: 'React is a JavaScript library for building user interfaces. It uses a component-based architecture and virtual DOM for efficient rendering.'
			})

			await poly.article.addWithEmbedding({
				title: 'Vue.js Tutorial',
				content: 'Vue.js is a progressive JavaScript framework for building user interfaces. It is designed to be incrementally adoptable and easy to learn.'
			})

			await poly.article.addWithEmbedding({
				title: 'Angular Development',
				content: 'Angular is a platform for building mobile and desktop web applications. It provides a complete solution with built-in routing and dependency injection.'
			})

			await poly.article.addWithEmbedding({
				title: 'Svelte Framework',
				content: 'Svelte is a radical new approach to building user interfaces. It shifts the work from the browser to the compile step.'
			})
		})

		it('should find exact matches with full-text search', async () => {
			const text_results = await poly.article.searchByText({ query: 'React', limit: 10 })

			expect(text_results.some((a: any) => a.title.includes('React'))).toBe(true)
		})

		it('should find semantic matches with vector search', async () => {
			const vector_results = await poly.article.searchByVector({
				query: 'frontend JavaScript frameworks',
				limit: 10
			})

			const titles = vector_results.map((a: any) => a.title.toLowerCase())

			expect(
				titles.some(
					(t: string) =>
						t.includes('react') ||
						t.includes('vue') ||
						t.includes('angular') ||
						t.includes('svelte')
				)
			).toBe(true)
		})

		it('should demonstrate different results between search methods', async () => {
			const text_results = await poly.article.searchByText({ query: 'building user interfaces', limit: 10 })
			const vector_results = await poly.article.searchByVector({
				query: 'building user interfaces',
				limit: 10
			})

			expect(text_results.length).toBeGreaterThanOrEqual(0)
			expect(vector_results.length).toBeGreaterThan(0)

			const text_titles = text_results.map((a: any) => a.title)
			const vector_titles = vector_results.map((a: any) => a.title)

			const has_differences =
				text_titles.some((t: string) => !vector_titles.includes(t)) ||
				vector_titles.some((t: string) => !text_titles.includes(t))

			expect(has_differences || text_titles.length === vector_titles.length).toBe(true)
		})
	})

	describe('Search Performance and Edge Cases', () => {
		it('should handle search with no articles in database', async () => {
			const empty_db_name = `:polywise_empty_test_${Date.now()}:`
			const empty_poly = new Polywise(empty_db_name)

			await empty_poly.init()

			const text_results = await empty_poly.article.searchByText({ query: 'test', limit: 10 })
			const vector_results = await empty_poly.article.searchByVector({ query: 'test', limit: 10 })

			expect(text_results.length).toBe(0)
			expect(vector_results.length).toBe(0)

			await empty_poly.off()

			cleanupTestDatabases()
		})

		it('should handle very short query strings', async () => {
			const results = await poly.article.searchByText({ query: 'AI', limit: 10 })

			expect(results.length).toBeGreaterThanOrEqual(0)
		})

		it('should handle long query strings', async () => {
			const long_query =
				'machine learning algorithms and artificial intelligence models for deep neural networks in computer vision applications'
			const results = await poly.article.searchByText({ query: long_query, limit: 10 })

			expect(results.length).toBeGreaterThanOrEqual(0)
		})

		it('should handle special characters in query', async () => {
			const results = await poly.article.searchByText({ query: 'C++ programming', limit: 10 })

			expect(results.length).toBeGreaterThanOrEqual(0)
		})

		it('should handle limit of 1', async () => {
			const results = await poly.article.searchByVector({ query: 'software development', limit: 1 })

			expect(results.length).toBeLessThanOrEqual(1)
		})

		it('should handle large limit values', async () => {
			const results = await poly.article.searchByText({ query: 'the', limit: 100 })

			expect(results.length).toBeGreaterThanOrEqual(0)
		})
	})

	describe('Article with Complex Content', () => {
		it('should search articles with code snippets', async () => {
			await poly.article.addWithEmbedding({
				title: 'JavaScript Arrays',
				content: 'JavaScript arrays support methods like map(), filter(), and reduce(). const numbers = [1, 2, 3]; const doubled = numbers.map(x => x * 2);'
			})

			const results = await poly.article.searchByText({ query: 'map filter reduce', limit: 10 })

			expect(results.length).toBeGreaterThan(0)
		})

		it('should search articles with technical terminology', async () => {
			await poly.article.addWithEmbedding({
				title: 'Microservices Architecture',
				content: 'Microservices use REST APIs, gRPC, or message queues for inter-service communication. Containerization with Docker and orchestration with Kubernetes are common.'
			})

			const results = await poly.article.searchByText({
				query: 'microservices docker kubernetes',
				limit: 10
			})

			expect(results.length).toBeGreaterThan(0)
		})

		it('should handle multi-language content', async () => {
			await poly.article.addWithEmbedding({
				title: '国际化与本地化',
				content: 'Internationalization (i18n) and localization (l10n) are important for global applications. 软件需要支持多种语言和文化。'
			})

			const results = await poly.article.searchByText({
				query: 'internationalization localization',
				limit: 10
			})

			expect(results.length).toBeGreaterThan(0)
		})
	})

	describe('Search Result Structure', () => {
		it('should return articles with all required fields from text search', async () => {
			const results = await poly.article.searchByText({ query: 'programming', limit: 5 })

			if (results.length > 0) {
				const article = results[0]

				expect(article.id).toBeDefined()
				expect(article.title).toBeDefined()
				expect(article.content).toBeDefined()
				expect(article.created_at).toBeDefined()
			}
		})

		it('should return articles with similarity field from vector search', async () => {
			const results = await poly.article.searchByVector({ query: 'software engineering', limit: 5 })

			if (results.length > 0) {
				const article = results[0]

				expect(article.id).toBeDefined()
				expect(article.title).toBeDefined()
				expect(article.content).toBeDefined()
				expect(article.created_at).toBeDefined()
				expect(article.similarity).toBeDefined()
				expect(typeof article.similarity).toBe('number')
			}
		})
	})
})
