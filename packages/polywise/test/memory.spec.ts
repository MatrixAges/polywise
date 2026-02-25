import { describe, expect, it } from '@rstest/core'

import { software_architecture_datasets } from './datasets/software'
import withPolywise from './utils/withPolywise'

describe.concurrent('Memory CRUD', () => {
	it('should save content and return it by query', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = software_architecture_datasets[0]
				const memory_id = await poly.save({ content: content_text })

				const result = await poly.query({ query: content_text, threshold: 0 })
				const has_memory = result.memory.some(item => item.memory_id === memory_id)

				expect(has_memory).toBe(true)
			}
		})
	})

	it('should update memory content and keep the same id', async () => {
		await withPolywise({
			run_fn: async poly => {
				const original_content = software_architecture_datasets[1]
				const updated_content = software_architecture_datasets[2]
				const memory_id = await poly.save({ content: original_content })

				const updated_id = await poly.update({ memory_id, content: updated_content })

				const result = await poly.query({ query: updated_content, threshold: 0 })
				const has_memory = result.memory.some(item => item.memory_id === updated_id)

				expect(updated_id).toBe(memory_id)
				expect(has_memory).toBe(true)
			}
		})
	})

	it('should forget memory and remove it from query results', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = software_architecture_datasets[3]
				const memory_id = await poly.save({ content: content_text })

				await poly.forget({ memory_id })

				const result = await poly.query({ query: content_text, threshold: 0 })
				const has_memory = result.memory.some(item => item.memory_id === memory_id)

				expect(has_memory).toBe(false)
			}
		})
	})

	it('should attach source confidence metadata after query', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = software_architecture_datasets[4]
				await poly.save({ content: content_text })

				const result = await poly.query({ query: content_text, threshold: 0 })
				const confidence = result.memory[0]?.metadata?.source_confidence

				expect(typeof confidence).toBe('number')
			}
		})
	})
})
