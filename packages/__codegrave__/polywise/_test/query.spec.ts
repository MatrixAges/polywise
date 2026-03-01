import { describe, expect, it } from '@rstest/core'

import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'
import withPolywise from './utils/withPolywise'

describe.concurrent('Query behavior', () => {
	it('should retrieve memory using keyword query', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = software_architecture_datasets[1]
				const memory_id = await poly.save({ content: content_text })

				const result = await poly.query({ query: 'Kubernetes orchestrates Docker', threshold: 0 })
				const has_memory = result.memory.some(item => item.memory_id === memory_id)

				expect(has_memory).toBe(true)
			}
		})
	})

	it('should respect rerank_limit in query results', async () => {
		await withPolywise({
			run_fn: async poly => {
				const contents = software_architecture_datasets.slice(5, 11)

				for (const content of contents) {
					await poly.save({ content })
				}

				const result = await poly.query({ query: contents[0], rerank_limit: 2, threshold: 0 })

				expect(result.memory.length).toBeLessThanOrEqual(2)
			}
		})
	})

	it('should reduce results when threshold increases', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = cognitive_science_datasets[5]
				await poly.save({ content: content_text })

				const low_threshold = await poly.query({ query: content_text, threshold: 0 })
				const high_threshold = await poly.query({ query: content_text, threshold: 0.85 })

				expect(high_threshold.memory.length).toBeLessThanOrEqual(low_threshold.memory.length)
			}
		})
	})

	it('should expose cot emitter when requested', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = software_architecture_datasets[12]
				await poly.save({ content: content_text })

				const result = await poly.query({ query: content_text, cot_depth: 2, threshold: 0 })

				expect(result.memory.length).toBeGreaterThan(0)
				expect(result.cot).not.toBeNull()
			}
		})
	})

	it('should support stimulated recall queries', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = cognitive_science_datasets[6]
				await poly.save({ content: content_text })

				const result = await poly.query({
					query: content_text,
					stimulate_on_recall: true,
					threshold: 0
				})

				expect(result.memory.length).toBeGreaterThan(0)
			}
		})
	})

	it('should recall after multi-sample ingestion', async () => {
		await withPolywise({
			run_fn: async poly => {
				const contents = cognitive_science_datasets.slice(0, 4)

				for (const content of contents) {
					await poly.save({ content })
				}

				const result = await poly.query({ query: contents[2], threshold: 0 })

				expect(result.memory.length).toBeGreaterThan(0)
			}
		})
	})

	it('should handle sequential queries without errors', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = software_architecture_datasets[13]
				await poly.save({ content: content_text })

				const first = await poly.query({ query: content_text, threshold: 0 })
				const second = await poly.query({ query: content_text, threshold: 0 })

				expect(first.memory.length).toBeGreaterThan(0)
				expect(second.memory.length).toBeGreaterThan(0)
			}
		})
	})
})
