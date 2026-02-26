import { describe, expect, it } from '@rstest/core'

import { behavioral_knowledge } from './datasets/behavioral'
import { cognitive_science_datasets } from './datasets/cognitive'
import withPolywise from './utils/withPolywise'

describe.concurrent('Context behavior', () => {
	it('should isolate results by idol_id filters', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_a = behavioral_knowledge[0]
				const content_b = behavioral_knowledge[1]
				const memory_a = await poly.save({ content: content_a, idol_id: 'idol_a' })
				const memory_b = await poly.save({ content: content_b, idol_id: 'idol_b' })

				const result_a = await poly.query({ query: content_a, idol_id: 'idol_a', threshold: 0 })
				const result_b = await poly.query({ query: content_b, idol_id: 'idol_b', threshold: 0 })

				const has_a = result_a.memory.some(item => item.memory_id === memory_a)
				const has_b = result_b.memory.some(item => item.memory_id === memory_b)

				expect(has_a).toBe(true)
				expect(has_b).toBe(true)
			}
		})
	})

	it('should respect init filters during save and query', async () => {
		await withPolywise({
			init_args: { idol_id: 'idol_context' },
			run_fn: async poly => {
				const content_text = behavioral_knowledge[2]
				const memory_id = await poly.save({ content: content_text })

				const result = await poly.query({ query: content_text, threshold: 0 })
				const has_memory = result.memory.some(item => item.memory_id === memory_id)

				expect(has_memory).toBe(true)
			}
		})
	})

	it('should recall memories across sequential saves and repeated queries', async () => {
		await withPolywise({
			run_fn: async poly => {
				const contents = behavioral_knowledge.slice(3, 6)

				for (const content of contents) {
					await poly.save({ content })
				}

				const first = await poly.query({ query: contents[2], threshold: 0 })
				const second = await poly.query({ query: contents[2], threshold: 0 })

				expect(first.memory.length).toBeGreaterThan(0)
				expect(second.memory.length).toBeGreaterThan(0)
			}
		})
	})

	it('should recall updated memory across temporal updates', async () => {
		await withPolywise({
			run_fn: async poly => {
				const content_text = cognitive_science_datasets[7]
				const memory_id = await poly.save({ content: content_text })

				const updated_content = cognitive_science_datasets[8]
				await poly.update({ memory_id, content: updated_content })

				const result = await poly.query({ query: updated_content, threshold: 0 })
				const has_memory = result.memory.some(item => item.memory_id === memory_id)

				expect(has_memory).toBe(true)
			}
		})
	})
})
