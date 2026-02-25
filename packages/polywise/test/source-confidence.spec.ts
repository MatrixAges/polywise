import { describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { getTestKeywords, getTestRerank, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Source confidence persistence', () => {
	const createPoly = async () => {
		const poly = new Polywise()
		const db_name = getDataDir()

		await poly.init({
			data_dir: db_name,
			embedding_config: { type: 'custom', fn: getTestVectors },
			reranker_config: { type: 'custom', fn: getTestRerank },
			keyword_config: { type: 'custom', fn: getTestKeywords }
		})

		return poly
	}

	it('should store source_confidence in article metadata after query', async () => {
		const poly = await createPoly()

		try {
			const content = 'Neural signals travel across synapses.'
			const memory_id = await poly.save({ content })

			const result = await poly.query({ query: 'synapses' })
			const memory_item = result.memory.find(item => item.memory_id === memory_id)

			expect(memory_item).toBeDefined()

			const articles = await poly.article.getMany([memory_id])
			const metadata = articles?.[0]?.metadata as { source_confidence?: number } | undefined

			expect(metadata?.source_confidence).toBeDefined()
			expect(metadata?.source_confidence as number).toBeGreaterThan(0)
		} finally {
			await poly.off()
		}
	})

	it('should preserve source_confidence when update omits metadata', async () => {
		const poly = await createPoly()

		try {
			const content = 'Neural signals travel across synapses.'
			const memory_id = await poly.save({
				content,
				metadata: { source_confidence: 0.2, conflict_count: 1 }
			})

			await poly.update({
				memory_id,
				content: `${content} Updated.`
			})

			const articles = await poly.article.getMany([memory_id])
			const metadata = articles?.[0]?.metadata as
				| {
						source_confidence?: number
						conflict_count?: number
				  }
				| undefined

			expect(metadata?.source_confidence).toBeCloseTo(0.2, 5)
			expect(metadata?.conflict_count).toBe(1)
		} finally {
			await poly.off()
		}
	})

	it('should blend source_confidence with prior value after query', async () => {
		const poly = await createPoly()

		try {
			const content = 'Synapses transmit electrical signals in neural tissue.'
			const memory_id = await poly.save({
				content,
				metadata: { source_confidence: 0.1 }
			})

			await poly.query({
				query: content,
				threshold: 0
			})

			const articles = await poly.article.getMany([memory_id])
			const metadata = articles?.[0]?.metadata as { source_confidence?: number } | undefined

			expect(metadata?.source_confidence).toBeGreaterThan(0.1)
			expect(metadata?.source_confidence).toBeLessThan(0.9)
		} finally {
			await poly.off()
		}
	})
})
