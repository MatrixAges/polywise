import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { getTestVectors } from '../scripts/getTestVectors'
import Polywise from '../src/Polywise'
import getDataDir from './utils/getDataDir'

describe('Polywise Save Implementation', () => {
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
			embedding_concurrency: 5,
			reranker_concurrency: 5
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should save content as an article and store its embedding', async () => {
		const content =
			'Polywise is a neuroscience-inspired knowledge graph system that uses PGlite and local embeddings.'

		await poly.save({ content })

		// Verify article was created
		const articles = await poly.article.getAll()
		expect(articles.length).toBe(1)
		expect(articles[0].content).toBe(content)

		// Verify embedding was created
		const article_id = articles[0].id
		const embedding_res = await (poly as any).queryRaw(
			`SELECT article_id FROM knowledge.article_embeddings WHERE article_id = $1`,
			[article_id]
		)
		expect(embedding_res.length).toBe(1)
		expect(embedding_res[0].article_id).toBe(article_id)
	})

	it('should update existing article embedding when saved with existing article_id', async () => {
		const articles = await poly.article.getAll()
		const article_id = articles[0].id
		const new_content = 'Polywise uses local models like Qwen3-Embedding and BGE-Reranker for high performance.'

		await poly.save({
			content: new_content,
			article_id
		})

		const updated_articles = await poly.article.getAll()
		expect(updated_articles.length).toBe(1)
	})

	it('should handle metadata and associations during save', async () => {
		const content = 'The prefrontal cortex is involved in complex cognitive behavior and decision making.'
		const metadata = {
			desc: 'Neuroscience concept',
			links: ['https://en.wikipedia.org/wiki/Prefrontal_cortex']
		}

		await poly.save({
			content,
			metadata,
			idol_id: 'neuro_expert',
			root_ids: ['neuroscience_root']
		})

		const articles = await poly.article.getAll()
		const latest_article = articles.find(a => a.content === content)
		expect(latest_article).toBeDefined()
	})
})
