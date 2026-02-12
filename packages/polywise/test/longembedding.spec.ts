import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { getTestVectors } from '../scripts/getTestVectors'
import Polywise from '../src/Polywise'
import processText from '../src/utils/processText'
import { long_text } from './datasets/longembedding'
import getDataDir from './utils/getDataDir'

describe.concurrent('Long Text Embedding & Fact Preservation', () => {
	let poly: Polywise
	const db_name = getDataDir()

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			}
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should verify that text larger than 90kb is correctly sliced into multiple chunks', async () => {
		const byte_size = Buffer.byteLength(long_text, 'utf8')
		expect(byte_size).toBeGreaterThan(90000)

		const chunks = await processText(long_text)

		expect(chunks.length).toBeGreaterThan(1)
		expect(chunks[0].length).toBeLessThan(long_text.length)
	})

	it('should produce a valid aggregated embedding for long text through the pipeline', async () => {
		const embedding = (await poly.pipeline.embed(long_text)) as Array<number>

		expect(embedding).toBeInstanceOf(Array)
		expect(embedding.length).toBe(1024)
		expect(embedding.every((val: number) => typeof val === 'number')).toBe(true)
	})

	describe('QA Fact Preservation', () => {
		beforeAll(async () => {
			await poly.article.addWithEmbedding(long_text)
		})

		it('should find the article when searching for the author "Jane Austen"', async () => {
			const results = await poly.article.searchByVector({
				query: 'Who is the author of the book?',
				limit: 1
			})

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].content).toContain('Jane Austen')
		})

		it('should find the article when searching for the publisher "George Allen"', async () => {
			const results = await poly.article.searchByVector({
				query: 'Who published this book and where?',
				limit: 1
			})

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].content).toContain('GEORGE ALLEN')
			expect(results[0].content).toContain('156 CHARING CROSS ROAD')
		})

		it('should find the article when searching for its original writing date "1796"', async () => {
			const results = await poly.article.searchByVector({
				query: 'When was the first shape of this book written?',
				limit: 1
			})

			expect(results.length).toBeGreaterThan(0)
			expect(results[0].content).toContain('1796')
		})
	})
})
