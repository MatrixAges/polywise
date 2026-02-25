import { describe, expect, it } from '@rstest/core'

import { long_context_datasets } from './datasets/longcontext'
import { long_text } from './datasets/longembedding'
import withPolywise from './utils/withPolywise'

describe.concurrent('Long content', () => {
	it('should retrieve memories from long context content', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = long_context_datasets[0].slice(0, 6000)
				await poly.save({ content: content_text })

				const result = await poly.query({ query: 'Polywise core architecture', threshold: 0 })

				expect(result.memory.length).toBeGreaterThan(0)
			}
		})
	})

	it('should return memories for large text inputs', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = long_text.slice(0, 30000)

				await poly.save({ content: content_text })

				const result = await poly.query({ query: 'Elizabeth', threshold: 0 })

				expect(result.memory.length).toBeGreaterThan(0)
			}
		})
	})
})
